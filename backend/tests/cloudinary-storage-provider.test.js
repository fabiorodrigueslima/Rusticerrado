import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCloudinaryStorageProvider } from '../src/providers/storageProvider.js'

const config = {
  CLOUDINARY_CLOUD_NAME: 'test-cloud',
  CLOUDINARY_API_KEY: 'test-key',
  CLOUDINARY_API_SECRET: 'test-secret',
  CLOUDINARY_FOLDER: 'rusticerrado/produtos',
  EXTERNAL_REQUEST_TIMEOUT_MS: 1000,
}

const signature = (value) => createHash('sha1').update(`${value}test-secret`).digest('hex')

describe('Cloudinary storage provider', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uploads an image with a signed server-side multipart request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1/asset-id.jpg',
        public_id: 'rusticerrado/produtos/asset-id',
      }), { status: 200 }),
    )
    const provider = createCloudinaryStorageProvider({
      config,
      fetchImpl: fetchMock,
      now: () => 1700000000,
      random: () => 'asset-id',
    })

    const result = await provider.put({
      buffer: Buffer.from([255, 216, 255]),
      mime: 'image/jpeg',
    })
    const [, request] = fetchMock.mock.calls[0]

    expect(result).toEqual({
      url: 'https://res.cloudinary.com/test/image/upload/v1/asset-id.jpg',
      providerAssetId: 'rusticerrado/produtos/asset-id',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    )
    expect(request.body.get('api_key')).toBe('test-key')
    expect(request.body.get('public_id')).toBe('asset-id')
    expect(request.body.get('folder')).toBe('rusticerrado/produtos')
    expect(request.body.get('timestamp')).toBe('1700000000')
    expect(request.body.get('signature')).toBe(
      signature('folder=rusticerrado/produtos&public_id=asset-id&timestamp=1700000000'),
    )
  })

  it('deletes by public_id and invalidates the CDN asset', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: 'ok' }), { status: 200 }),
    )
    const provider = createCloudinaryStorageProvider({
      config,
      fetchImpl: fetchMock,
      now: () => 1700000000,
    })

    await provider.delete('rusticerrado/produtos/asset-id')
    const [, request] = fetchMock.mock.calls[0]

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/test-cloud/image/destroy',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    )
    expect(request.body.get('public_id')).toBe('rusticerrado/produtos/asset-id')
    expect(request.body.get('invalidate')).toBe('true')
  })

  it('maps Cloudinary failures to a provider error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'provider failure' } }), { status: 500 }),
    )
    const provider = createCloudinaryStorageProvider({ config, fetchImpl: fetchMock })

    await expect(provider.put({
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      mime: 'image/png',
    })).rejects.toMatchObject({ status: 502, code: 'STORAGE_PROVIDER_ERROR' })
  })

  it('signs a one-time browser upload without exposing the API secret', () => {
    const provider = createCloudinaryStorageProvider({ config, now: () => 1700000000 })
    const upload = provider.signUpload('abc')
    expect(upload.publicId).toBe('rusticerrado/produtos/abc')
    expect(upload.uploadUrl).toBe('https://api.cloudinary.com/v1_1/test-cloud/image/upload')
    expect(upload.fields).toMatchObject({ overwrite: false, allowed_formats: 'jpg,png,webp', api_key: 'test-key' })
    expect(upload.fields.signature).toBe(signature('allowed_formats=jpg,png,webp&overwrite=false&public_id=rusticerrado/produtos/abc&timestamp=1700000000'))
    expect(JSON.stringify(upload)).not.toContain('test-secret')
  })

  it('accepts only photo URLs from this store account and this upload', () => {
    const provider = createCloudinaryStorageProvider({ config })
    const id = 'rusticerrado/produtos/abc'
    expect(provider.ownsUrl('https://res.cloudinary.com/test-cloud/image/upload/v17/rusticerrado/produtos/abc.jpg', id)).toBe(true)
    expect(provider.ownsUrl('https://res.cloudinary.com/other-cloud/image/upload/v17/rusticerrado/produtos/abc.jpg', id)).toBe(false)
    expect(provider.ownsUrl('https://res.cloudinary.com/test-cloud/image/upload/v17/rusticerrado/produtos/other.jpg', id)).toBe(false)
    expect(provider.ownsUrl('javascript:alert(1)', id)).toBe(false)
  })
})

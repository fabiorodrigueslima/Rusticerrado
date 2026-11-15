import { describe, expect, it, vi } from 'vitest'
import { createSupabaseStorageProvider } from '../src/providers/storageProvider.js'

const config = {
  SUPABASE_URL: 'https://abcdefgh.supabase.co/',
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  SUPABASE_STORAGE_BUCKET: 'rusticerrado',
  SUPABASE_STORAGE_FOLDER: 'produtos',
  EXTERNAL_REQUEST_TIMEOUT_MS: 4000,
}
const STORAGE = 'https://abcdefgh.supabase.co/storage/v1'
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82])

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('Supabase storage provider', () => {
  it('signs a one-time upload without sending the secret key to the browser', async () => {
    const fetchMock = vi.fn(async () => json({ url: '/object/upload/sign/rusticerrado/produtos/abc.png?token=t0k3n' }))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })

    const signed = await provider.signUpload('abc', 'image/png')

    expect(signed).toEqual({
      publicId: 'produtos/abc.png',
      uploadUrl: `${STORAGE}/object/upload/sign/rusticerrado/produtos/abc.png?token=t0k3n`,
      method: 'PUT',
      headers: { 'Content-Type': 'image/png', 'x-upsert': 'false' },
    })
    expect(JSON.stringify(signed)).not.toContain('sb_secret_test')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${STORAGE}/object/upload/sign/rusticerrado/produtos/abc.png`)
    expect(init.method).toBe('POST')
    expect(init.headers.apikey).toBe('sb_secret_test')
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('also sends a legacy service_role JWT as Bearer', async () => {
    const fetchMock = vi.fn(async () => json({ url: '/object/upload/sign/rusticerrado/produtos/abc.jpg?token=x' }))
    const provider = createSupabaseStorageProvider({ config: { ...config, SUPABASE_SECRET_KEY: 'eyJhbGciOi.legacy' }, fetchImpl: fetchMock })
    await provider.signUpload('abc', 'image/jpeg')
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ apikey: 'eyJhbGciOi.legacy', Authorization: 'Bearer eyJhbGciOi.legacy' })
  })

  it('refuses formats other than JPG, PNG and WEBP', async () => {
    const fetchMock = vi.fn()
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })
    await expect(provider.signUpload('abc', 'image/svg+xml')).rejects.toMatchObject({ code: 'IMAGE_INVALID' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('inspects the real size and the first bytes of the stored file', async () => {
    const fetchMock = vi.fn(async () => new Response(PNG, { status: 206, headers: { 'Content-Range': 'bytes 0-15/48213' } }))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })

    expect(await provider.inspect('produtos/abc.png')).toEqual({
      public_id: 'produtos/abc.png',
      resource_type: 'image',
      format: 'png',
      bytes: 48213,
      secure_url: `${STORAGE}/object/public/rusticerrado/produtos/abc.png`,
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${STORAGE}/object/authenticated/rusticerrado/produtos/abc.png`)
    expect(init.headers.Range).toBe('bytes=0-15')
  })

  it('reports a file that is not an image', async () => {
    const fetchMock = vi.fn(async () => new Response('<svg onload=alert(1)>', { status: 200 }))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })
    expect(await provider.inspect('produtos/abc.png')).toMatchObject({ resource_type: 'unknown', format: null })
  })

  it('uploads from the server into the products folder and returns the public URL', async () => {
    const fetchMock = vi.fn(async () => json({ Key: 'rusticerrado/produtos/k.png' }))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })

    await expect(provider.put({ key: 'k.png', buffer: PNG, mime: 'image/png' })).resolves.toEqual({
      url: `${STORAGE}/object/public/rusticerrado/produtos/k.png`,
      providerAssetId: 'produtos/k.png',
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${STORAGE}/object/rusticerrado/produtos/k.png`)
    expect(init).toMatchObject({ method: 'POST', body: PNG })
    expect(init.headers).toMatchObject({ 'Content-Type': 'image/png', 'x-upsert': 'false' })
  })

  it('deletes a photo and treats an already missing one as deleted', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ message: 'Successfully deleted' }))
      .mockResolvedValueOnce(json({ statusCode: '404', error: 'not_found', message: 'Object not found' }, 400))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })

    await provider.delete('produtos/a.png')
    await provider.delete('produtos/b.png')
    expect(fetchMock.mock.calls.map(([url, init]) => [init.method, url])).toEqual([
      ['DELETE', `${STORAGE}/object/rusticerrado/produtos/a.png`],
      ['DELETE', `${STORAGE}/object/rusticerrado/produtos/b.png`],
    ])
  })

  it('maps Supabase failures to a provider error', async () => {
    const fetchMock = vi.fn(async () => json({ message: 'unavailable' }, 500))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })
    await expect(provider.put({ key: 'k.png', buffer: PNG, mime: 'image/png' })).rejects.toMatchObject({ code: 'STORAGE_PROVIDER_ERROR' })
    await expect(provider.delete('produtos/k.png')).rejects.toMatchObject({ code: 'STORAGE_PROVIDER_ERROR' })
    await expect(provider.signUpload('k', 'image/png')).rejects.toMatchObject({ code: 'STORAGE_PROVIDER_ERROR' })
    await expect(provider.inspect('produtos/k.png')).rejects.toMatchObject({ code: 'STORAGE_LOOKUP_FAILED' })
  })

  it('creates a public bucket that only accepts photos up to 5 MB', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ error: 'Bucket not found' }, 404))
      .mockResolvedValueOnce(json({ name: 'rusticerrado' }))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })

    await expect(provider.ensureBucket()).resolves.toEqual({ bucket: 'rusticerrado', created: true })
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe(`${STORAGE}/bucket`)
    expect(JSON.parse(init.body)).toEqual({
      id: 'rusticerrado', name: 'rusticerrado', public: true, file_size_limit: 5242880,
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
    })
  })

  it('updates an existing bucket instead of failing', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ id: 'rusticerrado' }))
      .mockResolvedValueOnce(json({ message: 'Successfully updated' }))
    const provider = createSupabaseStorageProvider({ config, fetchImpl: fetchMock })
    await expect(provider.ensureBucket()).resolves.toEqual({ bucket: 'rusticerrado', created: false })
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT')
  })

  it('explains when Supabase is not configured', async () => {
    const provider = createSupabaseStorageProvider({ config: { ...config, SUPABASE_SECRET_KEY: undefined }, fetchImpl: vi.fn() })
    await expect(provider.signUpload('a', 'image/png')).rejects.toMatchObject({ code: 'STORAGE_NOT_CONFIGURED' })
  })
})

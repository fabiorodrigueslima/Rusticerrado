// Accepted photo formats. The type is decided by the first bytes of the file, never by the
// name or by what the browser claims.
export const IMAGE_TYPES = {
  'image/jpeg': {
    ext: 'jpg',
    magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    ext: 'png',
    magic: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  'image/webp': {
    ext: 'webp',
    magic: (b) => b.length >= 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
  },
}

export const IMAGE_MAX_BYTES = 5242880

export function extensionFor(mime) {
  return IMAGE_TYPES[mime]?.ext ?? null
}

// Returns the mime type the bytes really are, or null.
export function detectImageMime(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes ?? [])
  for (const [mime, type] of Object.entries(IMAGE_TYPES)) if (type.magic(buffer)) return mime
  return null
}

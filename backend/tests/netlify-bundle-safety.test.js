import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcDirectory = resolve(import.meta.dirname, '../src')

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : path.endsWith('.js') ? [path] : []
  }))
  return files.flat()
}

// The Netlify Function bundles the API as CommonJS, where import.meta is an empty object:
// import.meta.dirname is undefined and the whole API crashed on start (15/11/2026).
// Command-line scripts (src/scripts) run as ES modules and may use it.
describe('code that runs inside the Netlify Function', () => {
  it('never uses import.meta', async () => {
    const offenders = []
    for (const file of await sourceFiles(srcDirectory)) {
      if (relative(srcDirectory, file).startsWith('scripts')) continue
      if ((await readFile(file, 'utf8')).includes('import.meta')) offenders.push(relative(srcDirectory, file))
    }
    expect(offenders).toEqual([])
  })
})

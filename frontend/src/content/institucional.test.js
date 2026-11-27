import { describe, expect, it } from 'vitest'
import { paginaPronta } from './institucional.js'

describe('páginas Nossa História e Como é feito', () => {
  it('não vão para o ar enquanto não estiverem prontas', () => {
    expect(paginaPronta({ pronto: false, chamada: 'Oi', paragrafos: ['texto'] })).toBe(false)
    expect(paginaPronta({ pronto: true, chamada: '', paragrafos: ['texto'] })).toBe(false)
    expect(paginaPronta({ pronto: true, chamada: 'Oi', paragrafos: [] })).toBe(false)
    expect(paginaPronta({ pronto: true, chamada: 'Oi', etapas: [] })).toBe(false)
  })

  it('vão para o ar quando marcadas como prontas e com texto', () => {
    expect(paginaPronta({ pronto: true, chamada: 'Oi', paragrafos: ['texto'] })).toBe(true)
    expect(paginaPronta({ pronto: true, chamada: 'Oi', etapas: [{ titulo: 'Corte', texto: '...' }] })).toBe(true)
  })
})

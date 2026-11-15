import { describe, expect, it } from 'vitest'
import { formatPrice, roleLabel, slugify, toPrice } from './adminFormat.js'

describe('admin product helpers', () => {
  it('builds the store address from the product name', () => {
    expect(slugify('Brinco Folha Dourada!')).toBe('brinco-folha-dourada')
    expect(slugify('  Anéis & Colares  ')).toBe('aneis-colares')
  })

  it('accepts prices the way people type them', () => {
    expect(toPrice('89,9')).toBe('89.90')
    expect(toPrice('89.90')).toBe('89.90')
    expect(toPrice('R$ 1.089,50')).toBe('1089.50')
    expect(toPrice('120')).toBe('120.00')
  })

  it('rejects text that is not a price', () => {
    expect(toPrice('')).toBeNull()
    expect(toPrice('abc')).toBeNull()
    expect(toPrice('-5')).toBeNull()
  })

  it('names admin roles in Portuguese', () => {
    expect(roleLabel.OWNER).toBe('Dona/Dono')
    expect(roleLabel.MANAGER).toBe('Gerente')
    expect(roleLabel.FULFILLMENT).toBe('Expedição')
  })

  it('shows prices with a comma', () => {
    expect(formatPrice('89.90')).toBe('89,90')
    expect(formatPrice(null)).toBe('')
  })
})

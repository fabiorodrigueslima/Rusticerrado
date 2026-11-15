import { describe, expect, it } from 'vitest'
import { contact, formatPhone, whatsappLink } from './contact.js'

describe('canais da loja', () => {
  it('usa o WhatsApp oficial da página Contato', () => {
    expect(contact.whatsapp).toBe('5561999952341')
    expect(formatPhone()).toBe('(61) 99995-2341')
  })

  it('monta o link do WhatsApp com a mensagem já escrita', () => {
    expect(whatsappLink()).toBe('https://wa.me/5561999952341')
    expect(whatsappLink('Olá! Quero encomendar: Tábua & Cia')).toBe('https://wa.me/5561999952341?text=Ol%C3%A1!%20Quero%20encomendar%3A%20T%C3%A1bua%20%26%20Cia')
  })

  it('tem as redes sociais da página Contato', () => {
    expect(contact.instagram).toBe('https://www.instagram.com/rusticerrado/')
    expect(contact.facebook).toBe('https://www.facebook.com/rusticerrado')
  })
})

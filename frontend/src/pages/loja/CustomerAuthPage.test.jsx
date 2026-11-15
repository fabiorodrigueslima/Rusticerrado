import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CustomerAuthPage, safeNext } from './CustomerAuthPage.jsx'

globalThis.React = React

describe('customer password forms', () => {
  it.each(['login', 'register', 'reset'])('%s uses an eight-character minimum', mode => {
    const html = renderToStaticMarkup(<MemoryRouter><CustomerAuthPage mode={mode} /></MemoryRouter>)
    expect(html).toMatch(/<input(?=[^>]*type="password")(?=[^>]*minLength="8")[^>]*>/)
    expect(html).toContain('aria-label="Mostrar senha"')
    expect(html).not.toContain('minLength="12"')
  })
  it('returns only to same-site paths after login', () => {
    expect(safeNext('/pedido/RC-0123456789ABCDEF')).toBe('/pedido/RC-0123456789ABCDEF')
    for (const unsafe of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)'])
      expect(safeNext(unsafe)).toBe('/minha-conta')
  })
  it('recovery requests only the email address', () => {
    const html = renderToStaticMarkup(<MemoryRouter><CustomerAuthPage mode="forgot" /></MemoryRouter>)
    expect(html).toContain('type="email"')
    expect(html).not.toContain('type="password"')
  })
})

import { describe, expect, it, vi } from 'vitest'
import { abrirWhatsApp, mensagemContato, mensagemPersonalizado } from './mensagemWhatsapp.js'

describe('mensagens do WhatsApp', () => {
  it('monta a mensagem do Contato com o assunto escrito por extenso', () => {
    expect(mensagemContato({ nome: ' Ana ', assunto: 'produto', mensagem: 'A tábua grande ainda tem?' })).toBe(
      'Olá, RustiCerrado! Vim pelo site.\n*Nome:* Ana\n*Assunto:* Dúvida sobre produto\n*Mensagem:* A tábua grande ainda tem?',
    )
  })

  it('pula os campos em branco do pedido personalizado', () => {
    const texto = mensagemPersonalizado({
      nome: 'Marcos',
      tipo_produto: 'tabua',
      descricao: 'Tábua com o nome da família',
      tamanho: '40cm x 25cm',
      cores: '',
      orcamento_aproximado: '   ',
    })
    expect(texto).toBe(
      'Olá, RustiCerrado! Quero um orçamento de peça personalizada.\n*Nome:* Marcos\n*Peça:* Tábua (churrasco, corte ou servir)\n*Ideia:* Tábua com o nome da família\n*Tamanho:* 40cm x 25cm',
    )
  })
})

describe('abrirWhatsApp', () => {
  it('abre numa aba nova', () => {
    const aba = { opener: 'site' }
    const janela = { open: vi.fn(() => aba), location: { href: 'site' } }
    abrirWhatsApp('https://wa.me/55', janela)
    expect(janela.open).toHaveBeenCalledWith('https://wa.me/55', '_blank')
    expect(aba.opener).toBe(null)
    expect(janela.location.href).toBe('site')
  })

  it('abre na mesma aba quando o navegador bloqueia a aba nova', () => {
    const janela = { open: vi.fn(() => null), location: { href: 'site' } }
    abrirWhatsApp('https://wa.me/55', janela)
    expect(janela.location.href).toBe('https://wa.me/55')
  })
})

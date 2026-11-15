# Fotos dos produtos no Cloudinary

As fotos das peças ficam no **Cloudinary**, como no Brinco de Princesa. O banco continua no
Neon (veja [NEON.md](NEON.md)).

Como funciona quando a dona cadastra uma foto no painel:

1. O painel pede ao servidor uma **autorização de envio**, assinada e que vale para uma foto só.
2. O navegador manda a foto **direto para o Cloudinary** (sem passar pelo servidor).
3. O servidor **confere no Cloudinary** a foto que chegou (formato JPG, PNG ou WEBP, tamanho
   de até 5 MB, e se é mesmo a foto autorizada, da conta da loja). Só então ela entra na peça.

Fotos grandes de celular são diminuídas no próprio navegador antes do envio (até 2000 px).

## Passo 1 — Criar a conta

1. Entre em **cloudinary.com** → **Sign up for free**.
2. O ideal é uma **conta só da RustiCerrado** (por exemplo, com o e-mail da loja). Se usar a
   mesma conta do Brinco de Princesa, as duas lojas dividem os créditos grátis do mês.
3. Se ele perguntar o "cloud name", escolha algo como `rusticerrado`.

## Passo 2 — Pegar as três chaves

1. No painel do Cloudinary: **Settings** (engrenagem) → **API Keys**.
2. Anote:
   - **Cloud name** (aparece no topo da página);
   - **API Key** (um número);
   - **API Secret** (clique no olho para ver). 🔒 É secreta.

## Passo 3 — Colocar no projeto

No computador, em `backend/.env`:

```dotenv
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=rusticerrado
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=...
```

No Netlify, as mesmas quatro variáveis (o Claude pode cadastrar pelo conector). Depois,
**Deploys → Trigger deploy → Deploy project**.

As fotos ficam na pasta `rusticerrado/produtos` do Cloudinary (variável `CLOUDINARY_FOLDER`).

## Cuidados

- O **API Secret** fica só no `backend/.env` e nas variáveis do Netlify. Nunca no código, no
  chat, no GitHub ou com prefixo `VITE_`.
- Não apague fotos pelo painel do Cloudinary: apague pelo painel da loja, que tira a foto da
  peça e do Cloudinary juntos.

# Publicar no Netlify (plano grátis)

O site novo do RustiCerrado vai para o **Netlify Free**, como o Brinco de Princesa:

| Parte | No Netlify |
|---|---|
| Site (React) | arquivos estáticos de `frontend/dist` |
| Servidor (Express) | uma Netlify Function (`netlify/functions/api.mjs`) |
| Prévia da peça no WhatsApp | Edge Function `netlify/edge-functions/share-preview.js` |
| Regras e cabeçalhos de segurança | `netlify.toml` |

## ⚠️ Cuidado: o site antigo continua no ar

- O site antigo está na **Vercel**, publicado a partir da branch **`main`** do GitHub, e usa o
  banco principal do Neon. **Não mexa na `main` até o lançamento**: o site novo é publicado a
  partir da branch **`estrutura/frontend-backend`**.
- Durante os testes, o site novo usa o branch **`site-novo`** do Neon (veja [NEON.md](NEON.md)).

## ⚠️ Limite do plano grátis: 300 créditos por mês

Cada publicação gasta 15 créditos; tráfego e uso da função também gastam. Uma loja pequena gasta
em torno de 60 a 120 por mês. **Se acabarem, o Netlify pausa o site até o mês seguinte.**

- **Crie uma equipe (team) só para o RustiCerrado.** Se ele ficar na mesma equipe do Brinco de
  Princesa, os dois dividem os 300 créditos e uma pausa derruba os dois.
- O `netlify.toml` só publica a branch de produção, e só quando muda algo do site.
- Junte vários ajustes numa publicação só.

## Passo 1 — Criar o site no Netlify

1. Entre em **https://app.netlify.com** (com **Continue with GitHub**) e crie uma equipe nova
   para o RustiCerrado.
2. **Add new project → Import an existing project → GitHub** e autorize **só o repositório
   `Rusticerrado`**.
3. Em **Branch to deploy**, escolha **`estrutura/frontend-backend`** (não a `main`).
4. O resto vem do `netlify.toml` (build `npm run build`, pasta `frontend/dist`, funções).
   **Não altere nada.**
5. Antes de clicar em **Deploy**, cadastre as variáveis do Passo 2.

## Passo 2 — Variáveis de ambiente (modo catálogo)

O site sobe primeiro em **modo catálogo**: mostra as peças e o painel funciona, mas as compras
pelo site ficam desligadas ("compras online em breve"). As vendas entram depois (veja o fim).

Em **Project configuration → Environment variables**. 🔒 = segredo (marque *Contains secret values*).

| Variável | Valor |
|---|---|
| `SITE_MODE` | `catalog` |
| `PUBLIC_FRONTEND_URL` | `https://NOME-DO-SITE.netlify.app` (depois, `https://www.rusticerrado.com.br`) |
| `PUBLIC_BACKEND_URL` | o mesmo de cima |
| `FRONTEND_ORIGINS` | o mesmo de cima |
| `DATABASE_URL` 🔒 | conexão **com pooling** do usuário `rustic_app` (veja abaixo) |
| `DB_SSL` | `true` |
| `DB_POOL_MAX` | `3` |

**`DATABASE_URL` no Netlify:** é a mesma linha `DATABASE_URL` do `backend/.env`, trocando o
endereço do servidor pelo endereço **com `-pooler`** (ex.: `ep-nome-do-banco-pooler.c-7.us-east-1.aws.neon.tech`).
O Claude pode montar essa linha e cadastrá-la para você, sem precisar copiar senha.

`NODE_ENV` e `TRUST_PROXY` não precisam ser cadastradas: a função já usa `production` e `1`.

## Passo 3 — Primeira publicação e testes

1. Clique em **Deploy**. Em 1 a 2 minutos o site fica em `https://NOME-DO-SITE.netlify.app`.
2. Confira nesse endereço:
   - `/api/v1/ready` responde `"database":"ok"`;
   - a página inicial, a Loja e uma peça abrem;
   - `/sitemap.xml` lista as peças publicadas;
   - o painel `/admin` aceita o login;
   - Termos, Privacidade e Trocas abrem.

## Passo 4 — Lançamento (trocar o site antigo pelo novo)

Fazer só quando o site novo estiver aprovado:

1. Preparar o **banco principal** do Neon: `DATABASE_ADMIN_URL` do branch principal no
   `backend/.env` e `npm run db:setup` (não mexe nas tabelas do site antigo).
2. Trocar `DATABASE_URL` no Netlify pela do branch principal e fazer **Deploys → Trigger deploy**.
3. Apontar o domínio: no Netlify, **Domain management → Add a domain** →
   `www.rusticerrado.com.br` e `rusticerrado.com.br`. No **registro.br** (conta da empresa;
   peça para te colocarem como **contato técnico**), troque os registros que apontam para a
   Vercel pelos que o Netlify mostrar. O HTTPS sai sozinho.
4. Trocar `PUBLIC_FRONTEND_URL`, `PUBLIC_BACKEND_URL` e `FRONTEND_ORIGINS` para
   `https://www.rusticerrado.com.br` e publicar de novo.
5. Depois de alguns dias estável, desligar o projeto antigo na Vercel.

## Ao ligar as vendas

Antes de trocar `SITE_MODE` para `commerce`, é preciso: dados da empresa nas páginas legais
(`frontend/src/config/contact.js`), regras de frete, aplicativo do Mercado Pago (o mesmo
processo do Brinco: `MERCADO_PAGO_CLIENT_ID`, `MERCADO_PAGO_CLIENT_SECRET`,
`MERCADO_PAGO_WEBHOOK_SECRET`, `PAYMENT_TOKEN_KEY`), envio de e-mails, `CRON_SECRET` e
`OPS_ALERT_EMAIL`. Depois a dona conecta o Mercado Pago pelo painel e liga as vendas.

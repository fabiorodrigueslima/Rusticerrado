# Banco de dados no Neon

O RustiCerrado guarda produtos, pedidos, clientes e o painel num PostgreSQL do **Neon**
(o mesmo serviço do Brinco de Princesa). Não é preciso instalar PostgreSQL no computador:
o mesmo banco serve para testar e para o site no ar.

O site **nunca** fala direto com o banco: tudo passa pelo servidor (`backend/`). As tabelas
ficam numa área separada chamada `app`. Se o projeto do Neon já tiver tabelas antigas do
RustiCerrado, elas **não são apagadas nem alteradas**.

## Passo 1 — Abrir o projeto

1. Entre em **console.neon.tech** e abra o projeto do RustiCerrado.
2. Confira a região em **Settings → General**. O ideal é **South America (São Paulo)**,
   perto dos clientes. Se for outra, funciona do mesmo jeito, só um pouco mais lento.

## Passo 2 — Copiar o endereço de conexão do dono do banco

1. No painel do projeto, clique em **Connect**.
2. Escolha o branch **production** (ou `main`), o banco **neondb** e o papel **neondb_owner**.
3. **Desligue** a opção **Connection pooling** (o endereço não pode ter `-pooler`).
4. Clique em **Show password** e copie o endereço inteiro. Ele é assim:
   `postgresql://neondb_owner:SENHA@ep-xxxx-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
5. Abra `backend/.env` e cole na linha `DATABASE_ADMIN_URL=`.

> Pode colar com o `?sslmode=require...` do fim: o servidor tira esses parâmetros e usa a
> conexão segura dele, que sempre confere o certificado.

## Passo 3 — Preparar o banco

Na pasta principal do projeto:

```bash
npm run db:setup
```

O comando:

1. cria o usuário `rustic_app` (o que o site usa, com o mínimo de permissões) e o
   `rustic_owner` (dono das tabelas, sem login);
2. gera uma senha nova para o `rustic_app` e grava `DATABASE_URL` no fim do `backend/.env`;
3. cria as tabelas na área `app`;
4. aplica as migrations.

Pode rodar de novo sem medo: se as tabelas já existirem, ele só aplica migrations novas.

## Passo 4 — Criar o acesso da dona ao painel

```bash
npm run admin:create
```

Responda e-mail, nome e uma senha forte. É com esse acesso que ela entra em `/admin`.

## Passo 5 — Testar

```bash
npm run db:check
npm run dev
```

Em http://localhost:3000/api/v1/health/ready o banco deve aparecer como `"database":"ok"`.

## Cuidados

- `backend/.env` nunca vai para o GitHub.
- `DATABASE_ADMIN_URL` (dono do banco) serve só para preparar o banco e rodar migrations.
  No Netlify vai apenas a `DATABASE_URL` do `rustic_app`; lá é melhor usar o endereço **com
  pooling** (com `-pooler` no nome), trocando só o usuário e a senha pelos do `rustic_app`.
- Não crie tabelas pelo painel do Neon: toda mudança no banco é uma migration nova em
  `database/migrations/`.
- O plano grátis do Neon guarda o histórico por pouco tempo. Antes de vender, vale configurar
  uma cópia de segurança (o Brinco tem um guia em `docs/BACKUP.md`).

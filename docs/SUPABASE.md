# Banco de dados no Supabase

O RustiCerrado guarda tudo (produtos, pedidos, clientes, painel) no PostgreSQL do Supabase.
As fotos dos produtos também vão para o Supabase, no Storage (guia próprio, mais adiante).

O site **nunca** fala direto com o banco: tudo passa pelo servidor (`backend/`). Por isso as
tabelas ficam no schema `app`, que o Supabase não expõe na internet, e o site não usa as
chaves `anon` nem `service_role` para o banco.

## Passo 1 — Criar o projeto

1. Entre em **supabase.com** → **New project**.
2. Nome: `rusticerrado`. Região: **South America (São Paulo)**.
3. **Database Password**: use uma senha forte só com **letras e números** (símbolos como `@ # / ?`
   atrapalham o endereço de conexão). Guarde-a num lugar seguro.
4. **Create new project** e espere uns 2 minutos.

## Passo 2 — Copiar o endereço de conexão

1. No alto da página do projeto, clique em **Connect**.
2. Em **Connection String**, escolha o tipo **Session pooler** e copie a **URI**. Ela é assim:
   `postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
3. Abra `backend/.env` e cole na linha `DATABASE_ADMIN_URL=`, trocando `[YOUR-PASSWORD]`
   pela senha do passo 1 (sem os colchetes).

> Use o **Session pooler**, não o "Direct connection": a conexão direta do Supabase só funciona
> em internet com IPv6.

## Passo 3 — Baixar o certificado de segurança

1. **Project Settings** → **Database** → **SSL Configuration** → **Download certificate**.
2. Salve o arquivo como `backend/certs/supabase-ca.crt`.

Com ele o servidor confere que está falando com o Supabase de verdade (a verificação nunca é
desligada). O certificado é público e pode ir para o Git.

## Passo 4 — Preparar o banco

Na pasta principal do projeto:

```bash
npm run db:setup
```

O comando:

1. cria o usuário `rustic_app` (o que o site usa, com o mínimo de permissões) e o `rustic_owner`
   (dono das tabelas, sem login);
2. gera uma senha nova para o `rustic_app` e grava `DATABASE_URL` no `backend/.env`;
3. cria as tabelas no schema `app`;
4. aplica as migrations.

Pode rodar de novo sem medo: se as tabelas já existirem, ele só aplica migrations novas.

## Passo 5 — Testar

```bash
npm run db:check
npm run dev
```

Em http://localhost:3000/api/v1/health/ready o banco deve aparecer como `"database":"ok"`.

## Cuidados

- `backend/.env` nunca vai para o GitHub.
- `DATABASE_ADMIN_URL` (usuário `postgres`) serve só para preparar o banco e rodar migrations.
  No Netlify vai apenas a `DATABASE_URL` do `rustic_app`.
- Não crie tabelas pelo Table Editor nem pelo SQL Editor: toda mudança no banco é uma migration
  nova em `database/migrations/`.

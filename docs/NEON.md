# Banco de dados no Neon

O RustiCerrado guarda produtos, pedidos, clientes e o painel num PostgreSQL do **Neon**
(o mesmo serviço do Brinco de Princesa). Não é preciso instalar PostgreSQL no computador:
o mesmo banco serve para testar e para o site no ar.

O site **nunca** fala direto com o banco: tudo passa pelo servidor (`backend/`). As tabelas
ficam numa área separada chamada `app`. Se o projeto do Neon já tiver tabelas antigas do
RustiCerrado, elas **não são apagadas nem alteradas**.

## Passo 1 — Abrir o projeto

1. Entre em **console.neon.tech** e abra o projeto do RustiCerrado.
2. A região do projeto é **AWS US East 1 (Virgínia)** e não pode ser mudada. Ela é boa para
   o site: o servidor roda nas funções do Netlify, nos Estados Unidos, perto do banco.

## O site antigo usa este mesmo banco: teste num branch

O site antigo do RustiCerrado ainda está no ar e usa este projeto do Neon. O site novo fica
numa área separada (`app`) e o `db:setup` não mexe nas tabelas antigas, mas, enquanto o site
novo está em teste, o mais seguro é nem encostar no banco do site antigo:

1. No Neon, abra **Branches** → **Create branch**.
2. Nome: `site-novo`. Parent: o branch principal (**production** ou `main`). Crie.

O branch é uma cópia instantânea do banco (com os dados antigos). Tudo o que fizermos nele
(peças de teste, pedidos de teste) **não aparece no site antigo**, e o site antigo segue igual.

No lançamento do site novo, o `db:setup` roda uma vez no branch principal (passo 2 com
**production** no lugar de `site-novo`) e o site novo passa a usar o principal.

## Passo 2 — Copiar o endereço de conexão do dono do banco

1. No painel do projeto, clique em **Connect**.
2. Escolha o branch **site-novo** (durante os testes), o banco **neondb** e o papel **neondb_owner**.
3. **Desligue** a opção **Connection pooling** (o endereço não pode ter `-pooler`).
4. Clique em **Show password** e copie o endereço inteiro. Ele é assim:
   `postgresql://neondb_owner:SENHA@ep-nome-do-banco.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
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

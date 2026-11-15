# Fotos dos produtos no Supabase Storage

O banco de dados fica no **Neon** (veja [NEON.md](NEON.md)). O Supabase é usado só para guardar
as **fotos das peças**.

> O plano grátis do Supabase permite 2 projetos ativos por pessoa. Se a conta já tiver 2,
> é preciso liberar uma vaga (pausar um projeto parado) ou usar outro serviço de fotos.
> Enquanto as fotos não estiverem configuradas, o painel cadastra as peças normalmente e o
> site mostra a logo da RustiCerrado no lugar da foto.

## Passo 1 — Criar o projeto

1. Entre em **supabase.com** → **New project**.
2. Nome: `rusticerrado`. Região: **South America (São Paulo)**.
3. Crie uma senha forte para o banco do Supabase (ele não será usado, mas o Supabase pede).
4. **Create new project** e espere uns 2 minutos.

As fotos ficam numa "pasta" pública do Supabase chamada **bucket** (`rusticerrado`). Qualquer
pessoa vê uma foto publicada, mas só o servidor consegue autorizar um envio, conferir ou apagar
uma foto.

Como funciona quando a dona cadastra uma foto no painel:

1. O painel pede ao servidor uma **autorização de envio**, que vale para uma foto só.
2. O navegador manda a foto **direto para o Supabase** (sem passar pelo servidor).
3. O servidor **confere** a foto que chegou: tamanho e os primeiros bytes do arquivo (precisa
   ser JPG, PNG ou WEBP de verdade, com até 5 MB). Só então ela entra no produto.

## Passo 2 — Pegar o endereço e a chave secreta

1. **Project Settings** → **Data API** → copie a **Project URL** (`https://xxxx.supabase.co`).
2. **Project Settings** → **API Keys** → copie a **Secret key** (começa com `sb_secret_`).
   Se o projeto só mostrar as chaves antigas, use a `service_role`.
3. Em `backend/.env`:
   ```dotenv
   STORAGE_PROVIDER=supabase
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

> A chave secreta dá acesso total ao projeto. Ela fica **só** no `backend/.env` e, depois, nas
> variáveis do Netlify. Nunca no código, no chat, no GitHub ou com prefixo `VITE_`.

## Passo 3 — Criar o bucket de fotos

```bash
npm run storage:setup
```

Cria o bucket público `rusticerrado`, que só aceita JPG, PNG e WEBP de até 5 MB. Pode rodar de
novo: se ele já existir, só atualiza essas regras.

## Cuidados

- A chave secreta (`SUPABASE_SECRET_KEY`) fica só no `backend/.env` e nas variáveis do Netlify.
- O bucket é público para leitura (qualquer pessoa vê uma foto publicada), mas só o servidor
  envia, confere ou apaga fotos.

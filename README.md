# RustiCerrado

Loja virtual de peças artesanais em madeira e resina.

O projeto segue o mesmo modelo do Brinco de Princesa:

| Parte | Pasta | Tecnologia |
|---|---|---|
| Site (o que o cliente vê) | `frontend/` | React + Vite |
| Servidor (API e painel) | `backend/` | Node.js + Express |
| Banco de dados | `database/` | PostgreSQL no Supabase |
| Hospedagem | `netlify/` e `netlify.toml` | Netlify |

Fotos dos produtos: Supabase Storage (em preparação).

Não é preciso instalar PostgreSQL no computador: o banco fica no Supabase, para testar e para o site no ar.

## Rodar no computador

Precisa de Node 24 e npm 11.

1. Instale tudo pela pasta principal:
   ```bash
   npm install
   ```
2. Prepare o banco no Supabase (uma vez só). Siga o passo a passo em [docs/SUPABASE.md](docs/SUPABASE.md) e depois rode:
   ```bash
   npm run db:setup
   ```
3. Rode o site e o servidor juntos:
   ```bash
   npm run dev
   ```
   - Site: http://localhost:5173
   - Servidor: http://localhost:3000 (o site chama `/api` e o Vite repassa para cá)

## Comandos úteis

```bash
npm run db:setup      # prepara o banco no Supabase (pode repetir)
npm run db:check      # testa a conexão com o banco
npm run db:migrate    # aplica as migrations novas
npm run setup:check   # confere a configuração do servidor
npm test              # roda os testes
```

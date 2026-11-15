# RustiCerrado

Loja virtual de peças artesanais em madeira e resina.

O projeto segue o mesmo modelo do Brinco de Princesa:

| Parte | Pasta | Tecnologia |
|---|---|---|
| Site (o que o cliente vê) | `frontend/` | React + Vite |
| Servidor (API e painel) | `backend/` | Node.js + Express |
| Banco de dados | `database/` | PostgreSQL (Neon na internet, PostgreSQL local no computador) |
| Hospedagem | `netlify/` e `netlify.toml` | Netlify |

Fotos dos produtos: Supabase Storage (em preparação).

## Rodar no computador

Precisa de Node 24 e npm 11.

1. Instale tudo pela pasta principal:
   ```bash
   npm install
   ```
2. Crie o banco local (uma vez só). Antes, abra `backend/.env` e troque `SENHA_DO_POSTGRES` pela senha do usuário `postgres`:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\criar-banco-local.ps1
   ```
3. Rode o site e o servidor juntos:
   ```bash
   npm run dev
   ```
   - Site: http://localhost:5173
   - Servidor: http://localhost:3000 (o site chama `/api` e o Vite repassa para cá)

## Comandos úteis

```bash
npm run db:check      # testa a conexão com o banco
npm run db:migrate    # aplica as migrations novas
npm run setup:check   # confere a configuração do servidor
npm test              # roda os testes
```

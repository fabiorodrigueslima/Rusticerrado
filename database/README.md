# PostgreSQL manual

O banco usa SQL manual e `pg`, sem ORM. Os 26 objetos da baseline continuam definidos pelos scripts históricos; migrations incrementais adicionam contas de clientes, outbox de e-mail e solicitações de privacidade, totalizando 30 tabelas. Toda evolução posterior deve ser feita em `migrations/`.

## Estrutura

```text
database/
  migrations/          migrations incrementais imutáveis
  scripts/             inventários e diagnósticos somente leitura
  database.sql         bootstrap histórico de banco e papéis
  tables.sql           bootstrap histórico das 26 tabelas
  indexes.sql          bootstrap histórico dos índices
  seed.sql             dados públicos estruturais
  permissions.sql      menor privilégio do runtime
  verify.sql           verificação transacional com rollback
```

## Comandos reais

```powershell
npm run db:setup
npm run db:check
npm run db:migrate
npm test
```

`db:migrate` usa uma conexão administrativa separada, registra checksum e executa cada arquivo novo em transação.

Nunca edite uma migration aplicada. Crie a próxima versão numérica e execute todos os testes. Consulte `docs/DATABASE-MIGRATIONS.md`.

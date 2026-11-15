\set ON_ERROR_STOP on

-- Execute como um administrador do PostgreSQL:
-- psql -v APP_DB_PASSWORD="uma-senha-forte" -f database/database.sql postgres
-- A senha é recebida apenas pela sessão do psql e nunca deve ser salva neste arquivo.

\if :{?APP_DB_PASSWORD}
\else
  \echo 'ERRO: informe APP_DB_PASSWORD com -v. Nenhuma alteração foi feita.'
  \quit 1
\endif

SELECT 'CREATE ROLE rustic_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rustic_owner')
\gexec

SELECT format(
  'CREATE ROLE rustic_app LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',
  :'APP_DB_PASSWORD'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rustic_app')
\gexec

SELECT format('ALTER ROLE rustic_app PASSWORD %L', :'APP_DB_PASSWORD')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rustic_app')
\gexec

SELECT 'CREATE DATABASE rusticerrado OWNER rustic_owner ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'rusticerrado')
\gexec

REVOKE ALL ON DATABASE rusticerrado FROM PUBLIC;
GRANT CONNECT ON DATABASE rusticerrado TO rustic_app;
REVOKE TEMPORARY ON DATABASE rusticerrado FROM rustic_app;

\connect rusticerrado

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION rustic_owner;
GRANT USAGE ON SCHEMA app TO rustic_app;
ALTER ROLE rustic_app IN DATABASE rusticerrado SET search_path = app, public;
ALTER ROLE rustic_app IN DATABASE rusticerrado SET statement_timeout = '10s';
ALTER ROLE rustic_app IN DATABASE rusticerrado SET lock_timeout = '3s';

\echo 'Banco e papéis criados. Execute tables.sql, indexes.sql e seed.sql nesta ordem.'

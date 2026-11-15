\set ON_ERROR_STOP on
\connect rusticerrado

-- Execute como administrador depois de revisar o nome do banco acima.
-- Este script é idempotente e reduz o papel de runtime à leitura do catálogo público.
REVOKE TEMPORARY ON DATABASE rusticerrado FROM rustic_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

SET ROLE rustic_owner;
SET search_path = app, public;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA app FROM rustic_app;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app FROM rustic_app;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA app FROM rustic_app;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE rustic_owner IN SCHEMA app
  REVOKE ALL PRIVILEGES ON TABLES FROM rustic_app;
ALTER DEFAULT PRIVILEGES FOR ROLE rustic_owner IN SCHEMA app
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM rustic_app;
ALTER DEFAULT PRIVILEGES FOR ROLE rustic_owner IN SCHEMA app
  REVOKE ALL PRIVILEGES ON FUNCTIONS FROM rustic_app;
ALTER DEFAULT PRIVILEGES FOR ROLE rustic_owner IN SCHEMA app
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

GRANT SELECT ON app.categorias, app.colecoes, app.produtos, app.produto_variantes,
  app.produto_imagens, app.produto_colecoes TO rustic_app;

RESET ROLE;

\echo 'Permissões aplicadas: rustic_app possui somente CONNECT, USAGE no schema e SELECT no catálogo público.'

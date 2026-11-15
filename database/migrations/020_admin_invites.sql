-- Convites para novos administradores: o dono gera um link de uso único e a pessoa
-- convidada cria a própria senha. Só o hash SHA-256 do token é guardado.
CREATE TABLE app.admin_convites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(254) NOT NULL CHECK (position('@' IN email) > 1),
  nome VARCHAR(120) NOT NULL CHECK (length(trim(nome)) >= 2),
  papel VARCHAR(24) NOT NULL CHECK (papel IN ('OWNER','MANAGER','FULFILLMENT')),
  token_hash CHAR(64) NOT NULL UNIQUE,
  criado_por BIGINT NOT NULL REFERENCES app.usuarios_admin(id) ON DELETE RESTRICT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em TIMESTAMPTZ NOT NULL,
  usado_em TIMESTAMPTZ,
  usuario_id BIGINT REFERENCES app.usuarios_admin(id) ON DELETE RESTRICT,
  revogado_em TIMESTAMPTZ,
  CONSTRAINT admin_convites_prazo CHECK (expira_em > criado_em),
  CONSTRAINT admin_convites_uso CHECK ((usado_em IS NULL) = (usuario_id IS NULL))
);
-- No máximo um convite pendente por e-mail.
CREATE UNIQUE INDEX admin_convites_pendente_email_uk ON app.admin_convites(lower(email))
  WHERE usado_em IS NULL AND revogado_em IS NULL;
CREATE INDEX admin_convites_expira_idx ON app.admin_convites(expira_em);
GRANT SELECT, INSERT, UPDATE ON app.admin_convites TO rustic_app;
GRANT USAGE, SELECT ON SEQUENCE app.admin_convites_id_seq TO rustic_app;

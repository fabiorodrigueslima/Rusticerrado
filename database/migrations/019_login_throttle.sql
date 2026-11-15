-- Proteção contra tentativas de login por conta + rede de origem e por conta inteira.
-- Substitui o bloqueio global de 5 tentativas (usuarios_admin/clientes.bloqueado_ate),
-- que permitia a qualquer pessoa bloquear a conta de outra.
-- origem: hash SHA-256 da rede (IPv4 completo ou prefixo /64 do IPv6), ou 'ALL' para a conta inteira.
CREATE TABLE app.login_throttle (
  escopo VARCHAR(16) NOT NULL CHECK (escopo IN ('ADMIN','CUSTOMER')),
  conta_id BIGINT NOT NULL,
  origem VARCHAR(64) NOT NULL,
  falhas INTEGER NOT NULL DEFAULT 0 CHECK (falhas >= 0),
  janela_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  bloqueado_ate TIMESTAMPTZ,
  bloqueios INTEGER NOT NULL DEFAULT 0 CHECK (bloqueios >= 0),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (escopo, conta_id, origem)
);
CREATE INDEX login_throttle_atualizado_idx ON app.login_throttle(atualizado_em);
GRANT SELECT, INSERT, UPDATE, DELETE ON app.login_throttle TO rustic_app;

-- Bloqueios do mecanismo antigo deixam de valer; o histórico de contagem é preservado.
UPDATE app.usuarios_admin SET bloqueado_ate = NULL WHERE bloqueado_ate IS NOT NULL;
UPDATE app.clientes SET bloqueado_ate = NULL WHERE bloqueado_ate IS NOT NULL;

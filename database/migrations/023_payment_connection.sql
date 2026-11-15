-- "Conectar Mercado Pago" no painel: a dona da loja autoriza a conta dela (OAuth) e o
-- site guarda as chaves cifradas (AES-256-GCM, chave fora do banco). Nenhuma credencial
-- precisa ser copiada para a hospedagem.

-- Uma conexão por provedor. Os tokens só existem cifrados.
CREATE TABLE app.integracao_pagamento (
  provedor VARCHAR(32) PRIMARY KEY CHECK (provedor IN ('mercado-pago')),
  conta_id VARCHAR(64) NOT NULL,
  access_token_cifrado TEXT NOT NULL,
  refresh_token_cifrado TEXT NOT NULL,
  public_key VARCHAR(200),
  modo_producao BOOLEAN NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  conectado_por BIGINT REFERENCES app.usuarios_admin(id) ON DELETE SET NULL,
  conectado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  renovado_em TIMESTAMPTZ
);

-- Pedidos de autorização em andamento: o "state" volta do Mercado Pago e prova qual
-- administrador iniciou a conexão (o cookie do painel não acompanha esse redirecionamento).
-- Só o hash do state é guardado; o code_verifier (PKCE) fica cifrado. Vale 10 minutos, uma vez.
CREATE TABLE app.oauth_estados (
  state_hash CHAR(64) PRIMARY KEY,
  provedor VARCHAR(32) NOT NULL CHECK (provedor IN ('mercado-pago')),
  admin_id BIGINT NOT NULL REFERENCES app.usuarios_admin(id) ON DELETE CASCADE,
  code_verifier_cifrado TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em TIMESTAMPTZ NOT NULL,
  usado_em TIMESTAMPTZ,
  CONSTRAINT oauth_estados_prazo CHECK (expira_em > criado_em)
);
CREATE INDEX oauth_estados_expira_idx ON app.oauth_estados(expira_em);

-- Formas de pagamento aceitas no checkout, escolhidas no painel.
-- Boleto começa desligado: compensa em dias e segura a peça até o vencimento.
INSERT INTO app.configuracoes(chave, valor, descricao, publica)
VALUES ('payments.methods', '{"pix": true, "credit": true, "debit": true, "boleto": false, "maxInstallments": 3}'::jsonb,
        'Formas de pagamento aceitas no checkout (Pix, crédito, débito, boleto e parcelas máximas)', false)
ON CONFLICT (chave) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON app.integracao_pagamento, app.oauth_estados TO rustic_app;

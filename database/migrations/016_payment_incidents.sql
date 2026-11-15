-- Ocorrências financeiras que exigem decisão humana (pagamento tardio, divergência,
-- estorno, contestação). O webhook continua respondendo 200 ao provedor, mas o caso
-- fica registrado e visível no painel até ser resolvido por um administrador.
CREATE TABLE app.pagamento_ocorrencias (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES app.pedidos(id) ON DELETE RESTRICT,
  pagamento_id BIGINT REFERENCES app.pagamentos(id) ON DELETE RESTRICT,
  provedor VARCHAR(32) NOT NULL,
  gateway_payment_id VARCHAR(160) NOT NULL,
  tipo VARCHAR(32) NOT NULL CHECK (tipo IN ('LATE_PAYMENT','RESERVATION_EXPIRED','AMOUNT_MISMATCH','REFUND','CHARGEBACK')),
  status_pedido VARCHAR(24) NOT NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  moeda CHAR(3) NOT NULL CHECK (moeda ~ '^[A-Z]{3}$'),
  status VARCHAR(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED')),
  resolucao VARCHAR(1000),
  resolvido_por BIGINT REFERENCES app.usuarios_admin(id) ON DELETE SET NULL,
  resolvido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pagamento_ocorrencias_resolucao CHECK (
    (status = 'OPEN' AND resolvido_em IS NULL) OR
    (status = 'RESOLVED' AND resolvido_em IS NOT NULL AND length(trim(resolucao)) >= 3)
  )
);
CREATE UNIQUE INDEX pagamento_ocorrencias_evento_uk ON app.pagamento_ocorrencias(provedor, gateway_payment_id, tipo);
CREATE INDEX pagamento_ocorrencias_abertas_idx ON app.pagamento_ocorrencias(criado_em) WHERE status = 'OPEN';
GRANT SELECT, INSERT, UPDATE ON app.pagamento_ocorrencias TO rustic_app;
GRANT USAGE, SELECT ON SEQUENCE app.pagamento_ocorrencias_id_seq TO rustic_app;

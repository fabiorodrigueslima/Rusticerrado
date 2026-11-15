-- Permite que a rotina de manutenção remova credenciais temporárias vencidas
-- (sessões, tokens de redefinição/ativação e chaves de idempotência).
-- Logs de auditoria, webhooks e pedidos não são apagados por esta rotina.
GRANT DELETE ON app.sessoes, app.cliente_sessoes, app.cliente_password_reset_tokens,
  app.cliente_activation_tokens, app.idempotency_keys TO rustic_app;
CREATE INDEX IF NOT EXISTS idempotency_keys_expira_idx ON app.idempotency_keys(expira_em);
CREATE INDEX IF NOT EXISTS sessoes_expira_idx ON app.sessoes(expira_em);
CREATE INDEX IF NOT EXISTS cliente_sessoes_expira_idx ON app.cliente_sessoes(expira_em);

-- Chaves de idempotência guardavam o token de acesso do pedido em texto puro.
-- A resposta passa a ser armazenada sem o token; remove o valor dos registros antigos.
UPDATE app.idempotency_keys SET response_body = response_body - 'accessToken'
  WHERE response_body ? 'accessToken';

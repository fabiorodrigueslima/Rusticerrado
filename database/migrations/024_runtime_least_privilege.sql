-- Menor privilégio para o usuário do site (rustic_app).
--
-- 1. Registros de auditoria só recebem novas linhas: o código nunca altera auditoria,
--    movimentos de estoque nem histórico de status. Sem UPDATE, uma invasão do site não
--    consegue apagar os próprios rastros (DELETE já não era permitido).
REVOKE UPDATE ON app.audit_logs, app.movimentos_estoque, app.pedido_status_historico FROM rustic_app;

-- 2. Administradores: o site só altera estas colunas (login, bloqueio, senha, ativar/remover).
--    O cargo (papel) fica fora: nenhuma falha no site consegue promover alguém a dona da loja.
REVOKE UPDATE ON app.usuarios_admin FROM rustic_app;
GRANT UPDATE (ativo, email, password_hash, senha_alterada_em, tentativas_login_falhas, bloqueado_ate, ultimo_login_em, atualizado_em)
  ON app.usuarios_admin TO rustic_app;

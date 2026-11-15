-- "Esqueci a senha" do painel: o runtime passa a gravar e consumir os tokens de
-- redefinição dos administradores (a tabela e o índice existem desde a baseline, sem
-- permissões). Só o hash SHA-256 do token é guardado; o link vale 30 minutos e uma vez.
GRANT SELECT, INSERT, UPDATE, DELETE ON app.password_reset_tokens TO rustic_app;
GRANT USAGE, SELECT ON SEQUENCE app.password_reset_tokens_id_seq TO rustic_app;

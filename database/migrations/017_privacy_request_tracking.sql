-- Acompanhamento das solicitações de titulares (LGPD): prazo, fundamento do prazo,
-- resposta registrada e histórico imutável de mudanças de status.
-- O prazo de cada tipo é definido pela aplicação (backend/src/services/privacyDeadlines.js):
-- acesso segue o art. 19, II da LGPD; correção e exclusão usam meta interna, porque o
-- regulamento previsto no art. 18, §5º não foi confirmado como publicado.
ALTER TABLE app.privacy_requests
  ADD COLUMN prazo_em TIMESTAMPTZ,
  ADD COLUMN prazo_fundamento VARCHAR(32) NOT NULL DEFAULT 'INTERNAL_TARGET'
    CHECK (prazo_fundamento IN ('LGPD_ART_19_II','INTERNAL_TARGET')),
  ADD COLUMN resposta VARCHAR(2000),
  ADD COLUMN atendido_por BIGINT REFERENCES app.usuarios_admin(id) ON DELETE SET NULL,
  ADD COLUMN atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE app.privacy_requests SET prazo_em = criado_em + interval '15 days',
  prazo_fundamento = CASE WHEN tipo = 'ACCESS' THEN 'LGPD_ART_19_II' ELSE 'INTERNAL_TARGET' END
  WHERE prazo_em IS NULL;
ALTER TABLE app.privacy_requests
  ALTER COLUMN prazo_em SET DEFAULT now() + interval '15 days',
  ALTER COLUMN prazo_em SET NOT NULL;
CREATE INDEX privacy_requests_abertas_idx ON app.privacy_requests(prazo_em) WHERE status IN ('OPEN','IN_REVIEW');

CREATE TABLE app.privacy_request_eventos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES app.privacy_requests(id) ON DELETE RESTRICT,
  status_anterior VARCHAR(16),
  status_novo VARCHAR(16) NOT NULL,
  admin_id BIGINT REFERENCES app.usuarios_admin(id) ON DELETE SET NULL,
  nota VARCHAR(2000),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX privacy_request_eventos_request_idx ON app.privacy_request_eventos(request_id, criado_em);
INSERT INTO app.privacy_request_eventos(request_id, status_novo, criado_em)
  SELECT id, 'OPEN', criado_em FROM app.privacy_requests;
GRANT SELECT, INSERT ON app.privacy_request_eventos TO rustic_app;
GRANT USAGE, SELECT ON SEQUENCE app.privacy_request_eventos_id_seq TO rustic_app;

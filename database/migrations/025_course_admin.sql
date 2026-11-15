-- Cursos cadastrados pelo painel: carga horária, certificado (entregue quando o aluno pedir)
-- e a chave da foto no Cloudinary, para apagar a foto antiga quando outra for enviada.
ALTER TABLE app.cursos
  ADD COLUMN carga_horaria VARCHAR(60) NOT NULL DEFAULT '',
  ADD COLUMN certificado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN imagem_storage_key TEXT;

-- O envio direto de fotos (o mesmo das peças) passa a servir também para a foto do curso:
-- cada autorização de envio pertence a uma peça OU a um curso.
ALTER TABLE app.image_upload_intents
  ALTER COLUMN product_id DROP NOT NULL,
  ADD COLUMN curso_id BIGINT REFERENCES app.cursos(id),
  ADD COLUMN completed_at TIMESTAMPTZ,
  ADD CONSTRAINT image_upload_intents_um_destino CHECK ((product_id IS NULL) <> (curso_id IS NULL));

-- Envios de peças já concluídos contam como concluídos (a limpeza só apaga os abandonados).
UPDATE app.image_upload_intents SET completed_at = now() WHERE completed_image_id IS NOT NULL;

-- Permissões: as de tabela já existem (005 e 015). O site cadastra e edita cursos, mas nunca
-- apaga: um curso sai do ar sendo arquivado.

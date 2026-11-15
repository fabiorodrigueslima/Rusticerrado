-- Categorias iniciais do RustiCerrado (peças em madeira e resina).
-- As migrations anteriores vieram do Brinco de Princesa e criam categorias de bijuteria.
-- Elas saem do banco quando nenhuma peça as usa; se alguma peça usar, só deixam o site.
-- Depois desta migration, a dona da loja cria e edita categorias pelo painel.

UPDATE app.categorias
   SET ativa = FALSE,
       atualizado_em = now()
 WHERE slug IN ('brincos', 'aneis', 'colares', 'pulseiras', 'resina', 'florais');

DELETE FROM app.categorias c
 WHERE c.slug IN ('brincos', 'aneis', 'colares', 'pulseiras', 'resina', 'florais')
   AND NOT EXISTS (SELECT 1 FROM app.produtos p WHERE p.categoria_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM app.categorias filha WHERE filha.categoria_pai_id = c.id)
   AND NOT EXISTS (SELECT 1 FROM app.cupom_categorias cc WHERE cc.categoria_id = c.id);

INSERT INTO app.categorias (nome, slug, descricao, ativa, ordem)
VALUES
  ('Tábuas', 'tabuas', 'Tábuas de churrasco, de servir e de corte, em madeira e resina.', TRUE, 10),
  ('Petisqueiras', 'petisqueiras', 'Petisqueiras artesanais para servir com estilo.', TRUE, 20),
  ('Cozinha', 'cozinha', 'Porta-facas e utensílios de madeira para a cozinha.', TRUE, 30),
  ('Abridores', 'abridores', 'Abridores de garrafa artesanais.', TRUE, 40),
  ('Chaveiros', 'chaveiros', 'Chaveiros em madeira e resina.', TRUE, 50),
  ('Decoração', 'decoracao', 'Porta-joias e peças decorativas em madeira e resina.', TRUE, 60),
  ('Personalizados', 'personalizados', 'Peças feitas sob encomenda, do seu jeito.', TRUE, 70)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  ativa = TRUE,
  ordem = EXCLUDED.ordem,
  atualizado_em = now();

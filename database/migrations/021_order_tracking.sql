-- Rastreio do envio: ao marcar o pedido como Enviado, a loja informa o código da
-- transportadora (e, opcionalmente, o link de acompanhamento). A cliente vê os dois
-- na página do pedido e recebe o e-mail "Seu pedido foi enviado".
ALTER TABLE app.pedidos
  ADD COLUMN codigo_rastreio VARCHAR(40),
  ADD COLUMN rastreio_url TEXT,
  ADD COLUMN enviado_em TIMESTAMPTZ;

ALTER TABLE app.pedidos
  ADD CONSTRAINT pedidos_codigo_rastreio_formato
    CHECK (codigo_rastreio IS NULL OR codigo_rastreio ~ '^[A-Z0-9-]{4,40}$'),
  ADD CONSTRAINT pedidos_rastreio_url_https
    CHECK (rastreio_url IS NULL OR (rastreio_url ~ '^https://' AND length(rastreio_url) <= 500));

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "rusticerrado";
const DB_SSL =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
    : undefined;

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function baseConfig(database) {
  return {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database,
    ssl: DB_SSL,
  };
}

async function ensureDatabase() {
  const client = new Client(baseConfig("postgres"));
  await client.connect();

  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);

    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(DB_NAME)}`);
      console.log(`Banco ${DB_NAME} criado.`);
    } else {
      console.log(`Banco ${DB_NAME} ja existe.`);
    }
  } finally {
    await client.end();
  }
}

const schemaSql = `
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  cpf VARCHAR(20),
  foto TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enderecos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endereco VARCHAR(255),
  numero VARCHAR(30),
  complemento VARCHAR(120),
  bairro VARCHAR(120),
  cidade VARCHAR(120),
  estado CHAR(2),
  cep VARCHAR(20),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  imagem VARCHAR(500),
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  categoria VARCHAR(80),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  endereco_id INTEGER REFERENCES enderecos(id) ON DELETE SET NULL,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  frete NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (frete >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pedidos_status_valido CHECK (
    status IN ('pendente', 'pago', 'preparando', 'enviado', 'entregue', 'cancelado')
  )
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_enderecos_usuario_id ON enderecos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
`;

const seedSql = `
INSERT INTO produtos (id, nome, descricao, preco, imagem, estoque, categoria, ativo)
VALUES
  (1, 'Tabua de Churrasco Premium', 'Tabua artesanal em madeira e resina com acabamento premium.', 150.00, '/assets/produtos/tabua-churrasco.jpeg', 5, 'Tabuas', TRUE),
  (2, 'Abridor Magnetico', 'Abridor de garrafas artesanal com design unico.', 45.00, '/assets/produtos/abridor-magnetico.jpeg', 10, 'Abridores', TRUE),
  (3, 'Angico Preto', 'Peca artesanal feita em madeira Angico Preto.', 120.00, '/assets/produtos/angico-preto.jpeg', 4, 'Madeira', TRUE),
  (4, 'Chaveiro Personalizado', 'Chaveiro artesanal personalizado.', 25.00, '/assets/produtos/chaveiro-personalizado.jpeg', 20, 'Chaveiros', TRUE),
  (5, 'Petisqueira de Madeira', 'Petisqueira artesanal em madeira.', 85.00, '/assets/produtos/petisqueira-madeira.jpeg', 5, 'Petisqueiras', TRUE),
  (6, 'Porta Faca', 'Organizador de facas em madeira.', 90.00, '/assets/produtos/porta-faca.jpeg', 5, 'Cozinha', TRUE),
  (7, 'Porta Joias', 'Organizador de joias em madeira e resina.', 110.00, '/assets/produtos/porta-joias.jpeg', 3, 'Decoracao', TRUE),
  (8, 'Tabua de Servir', 'Tabua decorativa e funcional para servir.', 100.00, '/assets/produtos/tabua-servir.jpeg', 6, 'Tabuas', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('produtos_id_seq', GREATEST((SELECT MAX(id) FROM produtos), 1), TRUE);
`;

async function createSchema() {
  const client = new Client(baseConfig(DB_NAME));
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query(seedSql);
    await client.query("COMMIT");
    console.log("Tabelas e produtos iniciais preparados.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

try {
  await ensureDatabase();
  await createSchema();
  console.log("Banco de dados pronto para a API RustiCerrado.");
} catch (error) {
  console.error("Erro ao preparar banco de dados:", error.message);
  process.exitCode = 1;
}

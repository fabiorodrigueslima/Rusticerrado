import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "rusticerrado",
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
});

try {
  await client.connect();
  const result = await client.query(`
    SELECT 'usuarios' AS tabela, COUNT(*)::int AS total FROM usuarios
    UNION ALL
    SELECT 'enderecos', COUNT(*)::int FROM enderecos
    UNION ALL
    SELECT 'produtos', COUNT(*)::int FROM produtos
    UNION ALL
    SELECT 'pedidos', COUNT(*)::int FROM pedidos
    UNION ALL
    SELECT 'itens_pedido', COUNT(*)::int FROM itens_pedido
    ORDER BY tabela;
  `);

  console.table(result.rows);
} catch (error) {
  console.error("Erro ao verificar banco de dados:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

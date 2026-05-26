import { getMissingDatabaseEnv, pool } from "../backend/db.js";

export default async function handler(req, res) {
  const missing = getMissingDatabaseEnv();

  if (missing.length > 0) {
    return res.status(503).json({
      ok: false,
      databaseConfigured: false,
      missing,
    });
  }

  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        to_regclass('public.usuarios') IS NOT NULL AS usuarios,
        to_regclass('public.enderecos') IS NOT NULL AS enderecos,
        to_regclass('public.produtos') IS NOT NULL AS produtos,
        to_regclass('public.pedidos') IS NOT NULL AS pedidos,
        to_regclass('public.itens_pedido') IS NOT NULL AS itens_pedido;
    `);

    return res.status(200).json({
      ok: true,
      databaseConfigured: true,
      tables: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao verificar banco:", error);
    return res.status(500).json({
      ok: false,
      databaseConfigured: true,
      message: "Falha ao consultar banco de dados",
      code: error.code || null,
    });
  }
}

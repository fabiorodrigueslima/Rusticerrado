import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432),
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
});

export function getMissingDatabaseEnv() {
  return ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter(
    (key) => !process.env[key],
  );
}

if (!process.env.VERCEL) {
  pool
    .connect()
    .then((client) => {
      client.release();
      console.log("Conectado ao PostgreSQL");
    })
    .catch((err) => console.error("Erro ao conectar no banco:", err.message));
}

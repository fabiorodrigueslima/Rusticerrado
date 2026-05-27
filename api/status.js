import { getMissingDatabaseEnv } from "../backend/db.js";

export default function handler(req, res) {
  const missingDatabase = getMissingDatabaseEnv();

  res.status(200).json({
    ok: true,
    jwtConfigured: Boolean(process.env.JWT_SECRET),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    databaseConfigured: missingDatabase.length === 0,
    missingDatabase,
    nodeEnv: process.env.NODE_ENV || null,
  });
}

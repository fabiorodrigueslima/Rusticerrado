export default function handler(req, res) {
  const requiredDatabaseVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missingDatabase = requiredDatabaseVars.filter((key) => !process.env[key]);

  res.status(200).json({
    ok: true,
    jwtConfigured: Boolean(process.env.JWT_SECRET),
    databaseConfigured: missingDatabase.length === 0,
    missingDatabase,
    nodeEnv: process.env.NODE_ENV || null,
  });
}

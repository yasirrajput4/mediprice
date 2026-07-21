require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const migrationsDir = path.join(__dirname, "../../migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      run_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;

    const { rows } = await pool.query(
      "SELECT id FROM _migrations WHERE filename = $1",
      [file],
    );
    if (rows.length > 0) {
      console.log(`⏭  Skipping (already run): ${file}`);
      continue;
    }

    console.log(`⚡ Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
    await pool.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
    console.log(`✅ Done: ${file}`);
  }

  await pool.end();
  console.log("\n✅ All migrations complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

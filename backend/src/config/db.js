const { Pool } = require("pg");
const logger = require("../utils/logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  logger.error("Unexpected DB pool error:", err);
});

async function connectDB() {
  const client = await pool.connect();
  await client.query("SELECT 1");
  client.release();
}

// Helper: run a query using the pool
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug(`DB query executed in ${duration}ms: ${text.substring(0, 80)}`);
  return res;
}

// Helper: get a transaction client
async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient, connectDB };

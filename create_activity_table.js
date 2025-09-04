const { Pool } = require("pg");
const connectionString = process.env.DATABASE_URL || "postgresql://cks_portal_user:6Qp5x7v8wLzK9nMs4TbXpR3gY2@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db";
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_activity (
        activity_id SERIAL PRIMARY KEY,
        activity_type VARCHAR(50),
        actor_id VARCHAR(60),
        actor_role VARCHAR(20),
        target_id VARCHAR(60),
        target_type VARCHAR(20),
        description TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log("system_activity table created successfully");
  } catch (error) {
    console.error("Error creating table:", error.message);
  } finally {
    pool.end();
  }
}

createTable();

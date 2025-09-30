import pkg from "pg";
const { Pool } = pkg;
import { v4 as uuidv4 } from "uuid";

// Create a connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_R4PlognbL8qm@ep-winter-river-adogkt3g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 30000, // 30 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  query_timeout: 30000, // 30 seconds
});

/**
 * Execute a SQL query safely
 */
async function query(sql, params = []) {
  try {
    const safeParams = params.map((param) =>
      param === undefined ? null : param
    );
    console.log("SQL:", sql);
    console.log("Params:", JSON.stringify(safeParams));

    const result = await pool.query(sql, safeParams);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get all tech usage items
 */
export async function getAllTechUsages() {
  return await query('SELECT * FROM "TechUsage"');
}

/**
 * Get tech usage by ID
 */
export async function getTechUsageById(id) {
  const items = await query('SELECT * FROM "TechUsage" WHERE id = $1', [id]);
  return items[0] || null;
}

/**
 * Get all tech usage items for a specific user
 */
export async function getTechUsagesByUserId(userId) {
  return await query('SELECT * FROM "TechUsage" WHERE "userId" = $1', [userId]);
}

/**
 * Create a new tech usage item
 */
export async function createTechUsage(data) {
  const {
    id = uuidv4(),
    userId,
    deviceType,
    deviceName,
    skillLevel = "beginner",
    usageFrequency = "rarely",
    notes = null,
  } = data;

  const result = await query(
    `INSERT INTO "TechUsage" (id, "userId", "deviceType", "deviceName", "skillLevel", "usageFrequency", notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, userId, deviceType, deviceName, skillLevel, usageFrequency, notes]
  );

  console.log("Tech usage item created:", result);
  return result[0];
}

/**
 * Update a tech usage item
 */
export async function updateTechUsage(id, data) {
  const fields = Object.keys(data);
  const values = Object.values(data);

  const setClause = fields
    .map((field, idx) => `"${field}" = $${idx + 1}`)
    .join(", ");

  const result = await query(
    `UPDATE "TechUsage" SET ${setClause} WHERE id = $${
      fields.length + 1
    } RETURNING *`,
    [...values, id]
  );

  console.log("Tech usage item updated:", result);
  return result[0];
}

/**
 * Delete a tech usage item
 */
export async function deleteTechUsage(id) {
  const result = await pool.query('DELETE FROM "TechUsage" WHERE id = $1', [
    id,
  ]);
  return result.rowCount > 0;
}

/**
 * Delete all tech usage items for a user
 */
export async function deleteAllUserTechUsages(userId) {
  const result = await pool.query(
    'DELETE FROM "TechUsage" WHERE "userId" = $1',
    [userId]
  );
  return result.rowCount;
}

/**
 * Get tech usage counts grouped by device type
 */
export async function getTechUsageStatsByType() {
  return await query(`
    SELECT "deviceType", COUNT(*)::int as count 
    FROM "TechUsage" 
    GROUP BY "deviceType" 
    ORDER BY count DESC
  `);
}

/**
 * Get tech usage counts grouped by skill level
 */
export async function getTechUsageStatsBySkillLevel() {
  return await query(`
    SELECT "skillLevel", COUNT(*)::int as count 
    FROM "TechUsage" 
    GROUP BY "skillLevel" 
    ORDER BY count DESC
  `);
}

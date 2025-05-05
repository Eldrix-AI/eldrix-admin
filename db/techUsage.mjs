import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

// Create a connection pool
const pool = mysql.createPool({
  host:
    process.env.DB_HOST || "eldrix.c3u0owce2vpi.us-east-2.rds.amazonaws.com",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "B99U7lu2sYcOzCk1HWSG",
  database: process.env.DB_NAME || "eldrix-prod",
  port: parseInt(process.env.DB_PORT || "3306"),
  connectionLimit: 10,
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

    const [rows] = await pool.execute(sql, safeParams);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get all tech usage items
 */
export async function getAllTechUsages() {
  return await query("SELECT * FROM TechUsage");
}

/**
 * Get tech usage by ID
 */
export async function getTechUsageById(id) {
  const items = await query("SELECT * FROM TechUsage WHERE id = ?", [id]);
  return items[0] || null;
}

/**
 * Get all tech usage items for a specific user
 */
export async function getTechUsagesByUserId(userId) {
  return await query("SELECT * FROM TechUsage WHERE userId = ?", [userId]);
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
    `INSERT INTO TechUsage (id, userId, deviceType, deviceName, skillLevel, usageFrequency, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, deviceType, deviceName, skillLevel, usageFrequency, notes]
  );

  console.log("Tech usage item created:", result);
  return { id, ...data };
}

/**
 * Update a tech usage item
 */
export async function updateTechUsage(id, data) {
  const fields = Object.keys(data);
  const values = Object.values(data);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const result = await query(`UPDATE TechUsage SET ${setClause} WHERE id = ?`, [
    ...values,
    id,
  ]);

  console.log("Tech usage item updated:", result);
  return { id, ...data };
}

/**
 * Delete a tech usage item
 */
export async function deleteTechUsage(id) {
  const result = await query("DELETE FROM TechUsage WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Delete all tech usage items for a user
 */
export async function deleteAllUserTechUsages(userId) {
  const result = await query("DELETE FROM TechUsage WHERE userId = ?", [
    userId,
  ]);
  return result.affectedRows;
}

/**
 * Get tech usage counts grouped by device type
 */
export async function getTechUsageStatsByType() {
  return await query(`
    SELECT deviceType, COUNT(*) as count 
    FROM TechUsage 
    GROUP BY deviceType 
    ORDER BY count DESC
  `);
}

/**
 * Get tech usage counts grouped by skill level
 */
export async function getTechUsageStatsBySkillLevel() {
  return await query(`
    SELECT skillLevel, COUNT(*) as count 
    FROM TechUsage 
    GROUP BY skillLevel 
    ORDER BY count DESC
  `);
}

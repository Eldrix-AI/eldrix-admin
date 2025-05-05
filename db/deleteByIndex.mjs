import mysql from "mysql2/promise";

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
 * Delete a record by its ID
 * @param {string} tableName - The name of the table
 * @param {string} id - The ID of the record to delete
 * @returns {boolean} - True if deletion was successful
 */
export async function deleteById(tableName, id) {
  try {
    const result = await query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    console.log(`Deleted from ${tableName} with ID ${id}:`, result);
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete multiple records by their IDs
 * @param {string} tableName - The name of the table
 * @param {string[]} ids - Array of IDs to delete
 * @returns {number} - Number of records deleted
 */
export async function deleteMultipleByIds(tableName, ids) {
  if (!ids || ids.length === 0) {
    return 0;
  }

  try {
    const placeholders = ids.map(() => "?").join(",");
    const result = await query(
      `DELETE FROM ${tableName} WHERE id IN (${placeholders})`,
      ids
    );
    console.log(`Deleted ${result.affectedRows} records from ${tableName}`);
    return result.affectedRows;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete records based on a WHERE condition
 * @param {string} tableName - The name of the table
 * @param {string} whereClause - SQL WHERE clause (without the "WHERE" keyword)
 * @param {Array} params - Parameters for the WHERE clause
 * @returns {number} - Number of records deleted
 */
export async function deleteWhere(tableName, whereClause, params = []) {
  try {
    const result = await query(
      `DELETE FROM ${tableName} WHERE ${whereClause}`,
      params
    );
    console.log(
      `Deleted ${result.affectedRows} records from ${tableName} where ${whereClause}`
    );
    return result.affectedRows;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}

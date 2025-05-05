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
 * Delete all records from a table
 * DANGER: Use with extreme caution!
 * @param {string} tableName - The name of the table to clear
 * @param {boolean} confirm - Confirmation flag (must be true to execute)
 * @returns {number} - Number of records deleted
 */
export async function deleteAllRecords(tableName, confirm = false) {
  if (!confirm) {
    console.error(
      "DELETE ALL operation requires confirmation. Set confirm=true to proceed."
    );
    return 0;
  }

  try {
    // First count the records to be deleted
    const countResult = await query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const count = countResult[0].count;

    // Proceed with deletion
    const result = await query(`DELETE FROM ${tableName}`);

    console.log(
      `DELETED ALL RECORDS: Removed ${result.affectedRows} records from ${tableName}`
    );
    return result.affectedRows;
  } catch (error) {
    console.error(`Error deleting all records from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Truncate a table (faster than DELETE but resets auto-increment counters)
 * EXTREME DANGER: Use with extreme caution!
 * @param {string} tableName - The name of the table to truncate
 * @param {boolean} confirm - Confirmation flag (must be true to execute)
 * @returns {boolean} - True if successful
 */
export async function truncateTable(tableName, confirm = false) {
  if (!confirm) {
    console.error(
      "TRUNCATE operation requires confirmation. Set confirm=true to proceed."
    );
    return false;
  }

  try {
    await query(`TRUNCATE TABLE ${tableName}`);
    console.log(`TRUNCATED TABLE: ${tableName} has been completely cleared`);
    return true;
  } catch (error) {
    console.error(`Error truncating table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Reset database - EXTREME DANGER!
 * This will delete ALL data from specified tables
 * @param {string[]} tableNames - Array of table names to reset
 * @param {boolean} confirm - Confirmation flag (must be true to execute)
 * @returns {Object} - Results of each operation
 */
export async function resetDatabase(tableNames, confirm = false) {
  if (!confirm) {
    console.error(
      "DATABASE RESET operation requires confirmation. Set confirm=true to proceed."
    );
    return {};
  }

  const results = {};

  // Start a transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Temporarily disable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Truncate all specified tables
    for (const tableName of tableNames) {
      try {
        await connection.query(`TRUNCATE TABLE ${tableName}`);
        results[tableName] = "Truncated";
      } catch (error) {
        console.error(`Error truncating ${tableName}:`, error);
        results[tableName] = `Error: ${error.message}`;
      }
    }

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    // Commit the transaction
    await connection.commit();
    console.log("DATABASE RESET COMPLETED SUCCESSFULLY");
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error("DATABASE RESET FAILED:", error);
    throw error;
  } finally {
    // Always release connection
    connection.release();
  }

  return results;
}

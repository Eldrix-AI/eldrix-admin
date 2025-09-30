import pkg from "pg";
const { Pool } = pkg;

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
      `SELECT COUNT(*)::int as count FROM "${tableName}"`
    );
    const count = countResult[0].count;

    // Proceed with deletion
    const result = await pool.query(`DELETE FROM "${tableName}"`);

    console.log(
      `DELETED ALL RECORDS: Removed ${result.rowCount} records from ${tableName}`
    );
    return result.rowCount;
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
    await pool.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
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

  // Get a client from the pool to use for the transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Truncate all specified tables (CASCADE will handle foreign keys)
    for (const tableName of tableNames) {
      try {
        await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
        results[tableName] = "Truncated";
      } catch (error) {
        console.error(`Error truncating ${tableName}:`, error);
        results[tableName] = `Error: ${error.message}`;
      }
    }

    // Commit the transaction
    await client.query("COMMIT");
    console.log("DATABASE RESET COMPLETED SUCCESSFULLY");
  } catch (error) {
    // Rollback on error
    await client.query("ROLLBACK");
    console.error("DATABASE RESET FAILED:", error);
    throw error;
  } finally {
    // Always release client
    client.release();
  }

  return results;
}

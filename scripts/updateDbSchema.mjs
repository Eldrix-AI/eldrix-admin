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

async function execute(sql, params = []) {
  try {
    console.log("\n---------------------");
    console.log("Executing SQL:", sql);
    if (params.length > 0) {
      console.log("Params:", JSON.stringify(params));
    }

    const [result] = await pool.execute(sql, params);
    console.log("Result:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error executing query:", error.message);
    throw error;
  }
}

async function updateUserTable() {
  try {
    console.log("\n=== ADDING NEW COLUMNS TO USER TABLE ===");

    // Check if columns already exist
    const columns = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'User' 
      AND TABLE_SCHEMA = DATABASE()
    `);

    const columnNames = columns.map((col) => col.COLUMN_NAME);

    // Add notification column if it doesn't exist
    if (!columnNames.includes("notification")) {
      await execute(`
        ALTER TABLE User 
        ADD COLUMN notification BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log("Added notification column to User table");
    } else {
      console.log("notification column already exists");
    }

    // Add darkMode column if it doesn't exist
    if (!columnNames.includes("darkMode")) {
      await execute(`
        ALTER TABLE User 
        ADD COLUMN darkMode BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log("Added darkMode column to User table");
    } else {
      console.log("darkMode column already exists");
    }

    console.log("User table update completed successfully");
  } catch (error) {
    console.error("Failed to update User table:", error);
    throw error;
  }
}

async function createTechUsageTable() {
  try {
    console.log("\n=== CREATING TECH USAGE TABLE ===");

    // Check if TechUsage table exists
    const tables = await execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'TechUsage' 
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (tables.length === 0) {
      // Create TechUsage table with matching collation for userId
      await execute(`
        CREATE TABLE TechUsage (
          id VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          userId VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          deviceType VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          deviceName VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          skillLevel VARCHAR(191) COLLATE utf8mb4_unicode_ci DEFAULT 'beginner',
          usageFrequency VARCHAR(191) COLLATE utf8mb4_unicode_ci DEFAULT 'rarely',
          notes TEXT COLLATE utf8mb4_unicode_ci,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("Created TechUsage table");
    } else {
      console.log("TechUsage table already exists");
    }
  } catch (error) {
    console.error("Failed to create TechUsage table:", error);
    throw error;
  }
}

async function migrateExistingTechUsageData() {
  try {
    console.log("\n=== MIGRATING EXISTING TECH USAGE DATA ===");

    // Get all users with techUsage data
    const users = await execute(`
      SELECT id, techUsage 
      FROM User 
      WHERE techUsage IS NOT NULL AND techUsage != '[]' AND techUsage != ''
    `);

    console.log(`Found ${users.length} users with techUsage data to migrate`);

    // Migrate each user's tech usage data
    for (const user of users) {
      try {
        let techUsages = [];

        // Try to parse the techUsage JSON string
        try {
          techUsages = JSON.parse(user.techUsage);
          if (!Array.isArray(techUsages)) {
            techUsages = [];
          }
        } catch (e) {
          console.warn(
            `Failed to parse techUsage data for user ${user.id}:`,
            e.message
          );
          continue;
        }

        // Insert each tech usage item
        for (const item of techUsages) {
          const id = uuidv4();

          // Default values if not provided
          const deviceType = item.type || "unknown";
          const deviceName = item.name || "Unknown Device";

          await execute(
            `
            INSERT INTO TechUsage (id, userId, deviceType, deviceName)
            VALUES (?, ?, ?, ?)
          `,
            [id, user.id, deviceType, deviceName]
          );

          console.log(
            `Migrated tech usage data for user ${user.id}: ${deviceType} - ${deviceName}`
          );
        }
      } catch (error) {
        console.error(
          `Error migrating tech usage for user ${user.id}:`,
          error.message
        );
      }
    }

    console.log("Tech usage data migration completed");
  } catch (error) {
    console.error("Failed to migrate tech usage data:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Starting database schema update...");

    // 1. Add new columns to User table
    await updateUserTable();

    // 2. Create TechUsage table
    await createTechUsageTable();

    // 3. Migrate existing techUsage data
    try {
      await migrateExistingTechUsageData();
    } catch (migrationError) {
      console.error("Error during data migration:", migrationError);
      console.log("However, schema changes have been completed successfully.");
    }

    console.log("\n=== DATABASE SCHEMA UPDATE COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("\n!!! DATABASE SCHEMA UPDATE FAILED !!!", error);
  } finally {
    // Exit the process when done
    process.exit(0);
  }
}

main();

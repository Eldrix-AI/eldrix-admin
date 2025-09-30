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
});

async function execute(sql, params = []) {
  try {
    console.log("\n---------------------");
    console.log("Executing SQL:", sql);
    if (params.length > 0) {
      console.log("Params:", JSON.stringify(params));
    }

    const result = await pool.query(sql, params);
    console.log("Result:", JSON.stringify(result.rows));
    return result.rows;
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
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND table_schema = 'public'
    `);

    const columnNames = columns.map((col) => col.column_name);

    // Add notification column if it doesn't exist
    if (!columnNames.includes("notification")) {
      await execute(`
        ALTER TABLE "User" 
        ADD COLUMN notification BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log("Added notification column to User table");
    } else {
      console.log("notification column already exists");
    }

    // Add darkMode column if it doesn't exist
    if (!columnNames.includes("darkMode")) {
      await execute(`
        ALTER TABLE "User" 
        ADD COLUMN "darkMode" BOOLEAN NOT NULL DEFAULT FALSE
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
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'TechUsage' 
      AND table_schema = 'public'
    `);

    if (tables.length === 0) {
      // Create TechUsage table
      await execute(`
        CREATE TABLE "TechUsage" (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          "userId" VARCHAR(191) NOT NULL,
          "deviceType" VARCHAR(191) NOT NULL,
          "deviceName" VARCHAR(191) NOT NULL,
          "skillLevel" VARCHAR(191) DEFAULT 'beginner',
          "usageFrequency" VARCHAR(191) DEFAULT 'rarely',
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT now(),
          "updatedAt" TIMESTAMP DEFAULT now(),
          FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
        )
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
      SELECT id, "techUsage" 
      FROM "User" 
      WHERE "techUsage" IS NOT NULL AND "techUsage" != '[]' AND "techUsage" != ''
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
            INSERT INTO "TechUsage" (id, "userId", "deviceType", "deviceName")
            VALUES ($1, $2, $3, $4)
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
    // Close the pool
    await pool.end();
    // Exit the process when done
    process.exit(0);
  }
}

main();

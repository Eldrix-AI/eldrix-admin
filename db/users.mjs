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
 * Get all users
 */
export async function getAllUsers() {
  return await query('SELECT * FROM "User"');
}

/**
 * Get a user by ID
 */
export async function getUserById(id) {
  const users = await query('SELECT * FROM "User" WHERE id = $1', [id]);
  return users[0] || null;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email) {
  const users = await query('SELECT * FROM "User" WHERE email = $1', [email]);
  return users[0] || null;
}

/**
 * Create a new user
 */
export async function createUser(userData) {
  const {
    id,
    name,
    email,
    password,
    phone,
    imageUrl,
    description = "",
    smsConsent,
    emailList,
    age = null,
    techUsage = null,
    accessibilityNeeds = null,
    preferredContactMethod = "",
    experienceLevel = "",
  } = userData;

  const result = await query(
    `INSERT INTO "User" (id, name, email, password, phone, "imageUrl", description, 
     "smsConsent", "emailList", age, "techUsage", "accessibilityNeeds", 
     "preferredContactMethod", "experienceLevel")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      id,
      name,
      email,
      password,
      phone || null,
      imageUrl || null,
      description,
      smsConsent ? true : false,
      emailList ? true : false,
      age,
      techUsage,
      accessibilityNeeds,
      preferredContactMethod,
      experienceLevel,
    ]
  );

  console.log("User created:", result);
  return result[0];
}

/**
 * Update an existing user
 */
export async function updateUser(id, userData) {
  const fields = Object.keys(userData);
  const values = Object.values(userData);

  const setClause = fields
    .map((field, idx) => `"${field}" = $${idx + 1}`)
    .join(", ");

  const result = await query(
    `UPDATE "User" SET ${setClause} WHERE id = $${
      fields.length + 1
    } RETURNING *`,
    [...values, id]
  );

  console.log("User updated:", result);
  return result[0];
}

/**
 * Delete a user
 */
export async function deleteUser(id) {
  const result = await pool.query('DELETE FROM "User" WHERE id = $1', [id]);
  return result.rowCount > 0;
}

/**
 * Count total users
 */
export async function countUsers() {
  const result = await query('SELECT COUNT(*)::int as count FROM "User"');
  return result[0].count;
}

/**
 * Update user notification setting
 */
export async function updateUserNotificationSetting(
  userId,
  notificationEnabled
) {
  const result = await pool.query(
    `UPDATE "User" SET notification = $1 WHERE id = $2`,
    [notificationEnabled ? true : false, userId]
  );

  console.log(
    `Updated notification setting for user ${userId} to ${notificationEnabled}`
  );
  return result.rowCount > 0;
}

/**
 * Update user dark mode setting
 */
export async function updateUserDarkModeSetting(userId, darkModeEnabled) {
  const result = await pool.query(
    `UPDATE "User" SET "darkMode" = $1 WHERE id = $2`,
    [darkModeEnabled ? true : false, userId]
  );

  console.log(
    `Updated dark mode setting for user ${userId} to ${darkModeEnabled}`
  );
  return result.rowCount > 0;
}

/**
 * Get users with notification enabled
 */
export async function getUsersWithNotificationsEnabled() {
  return await query('SELECT * FROM "User" WHERE notification = TRUE');
}

/**
 * Get users with dark mode enabled
 */
export async function getUsersWithDarkModeEnabled() {
  return await query('SELECT * FROM "User" WHERE "darkMode" = TRUE');
}

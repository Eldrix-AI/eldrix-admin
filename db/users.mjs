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
 * Get all users
 */
export async function getAllUsers() {
  return await query("SELECT * FROM User");
}

/**
 * Get a user by ID
 */
export async function getUserById(id) {
  const users = await query("SELECT * FROM User WHERE id = ?", [id]);
  return users[0] || null;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email) {
  const users = await query("SELECT * FROM User WHERE email = ?", [email]);
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
    `INSERT INTO User (id, name, email, password, phone, imageUrl, description, 
     smsConsent, emailList, age, techUsage, accessibilityNeeds, 
     preferredContactMethod, experienceLevel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      email,
      password,
      phone || null,
      imageUrl || null,
      description,
      smsConsent ? 1 : 0,
      emailList ? 1 : 0,
      age,
      techUsage,
      accessibilityNeeds,
      preferredContactMethod,
      experienceLevel,
    ]
  );

  console.log("User created:", result);
  return { id, ...userData };
}

/**
 * Update an existing user
 */
export async function updateUser(id, userData) {
  const fields = Object.keys(userData);
  const values = Object.values(userData);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const result = await query(`UPDATE User SET ${setClause} WHERE id = ?`, [
    ...values,
    id,
  ]);

  console.log("User updated:", result);
  return { id, ...userData };
}

/**
 * Delete a user
 */
export async function deleteUser(id) {
  const result = await query("DELETE FROM User WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Count total users
 */
export async function countUsers() {
  const result = await query("SELECT COUNT(*) as count FROM User");
  return result[0].count;
}

/**
 * Update user notification setting
 */
export async function updateUserNotificationSetting(
  userId,
  notificationEnabled
) {
  const result = await query(`UPDATE User SET notification = ? WHERE id = ?`, [
    notificationEnabled ? 1 : 0,
    userId,
  ]);

  console.log(
    `Updated notification setting for user ${userId} to ${notificationEnabled}`
  );
  return result.affectedRows > 0;
}

/**
 * Update user dark mode setting
 */
export async function updateUserDarkModeSetting(userId, darkModeEnabled) {
  const result = await query(`UPDATE User SET darkMode = ? WHERE id = ?`, [
    darkModeEnabled ? 1 : 0,
    userId,
  ]);

  console.log(
    `Updated dark mode setting for user ${userId} to ${darkModeEnabled}`
  );
  return result.affectedRows > 0;
}

/**
 * Get users with notification enabled
 */
export async function getUsersWithNotificationsEnabled() {
  return await query("SELECT * FROM User WHERE notification = TRUE");
}

/**
 * Get users with dark mode enabled
 */
export async function getUsersWithDarkModeEnabled() {
  return await query("SELECT * FROM User WHERE darkMode = TRUE");
}

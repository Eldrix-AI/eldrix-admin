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
 * Get all messages
 */
export async function getAllMessages() {
  return await query("SELECT * FROM Message");
}

/**
 * Get all messages for a help session
 */
export async function getMessagesByHelpSessionId(helpSessionId) {
  return await query(
    "SELECT * FROM Message WHERE helpSessionId = ? ORDER BY createdAt ASC",
    [helpSessionId]
  );
}

/**
 * Get a message by ID
 */
export async function getMessageById(id) {
  const messages = await query("SELECT * FROM Message WHERE id = ?", [id]);
  return messages[0] || null;
}

/**
 * Create a new message
 */
export async function createMessage(messageData) {
  const {
    id,
    content,
    isAdmin = false,
    helpSessionId,
    read = false,
    createdAt = new Date(),
  } = messageData;

  const result = await query(
    `INSERT INTO Message (id, content, isAdmin, helpSessionId, \`read\`, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, content, isAdmin, helpSessionId, read, createdAt]
  );

  console.log("Message created:", result);
  return { id, ...messageData };
}

/**
 * Delete a message
 */
export async function deleteMessage(id) {
  const result = await query("DELETE FROM Message WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Get recent messages
 */
export async function getRecentMessages(limit = 10) {
  return await query("SELECT * FROM Message ORDER BY createdAt DESC LIMIT ?", [
    limit,
  ]);
}

/**
 * Count messages by help session
 */
export async function countMessagesByHelpSession(helpSessionId) {
  const result = await query(
    "SELECT COUNT(*) as count FROM Message WHERE helpSessionId = ?",
    [helpSessionId]
  );
  return result[0].count;
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(id) {
  const result = await query("UPDATE Message SET `read` = TRUE WHERE id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
}

/**
 * Mark all messages in a help session as read
 */
export async function markAllSessionMessagesAsRead(helpSessionId) {
  const result = await query(
    "UPDATE Message SET `read` = TRUE WHERE helpSessionId = ?",
    [helpSessionId]
  );
  return result.affectedRows;
}

/**
 * Get unread messages for a help session
 */
export async function getUnreadMessagesByHelpSessionId(helpSessionId) {
  return await query(
    "SELECT * FROM Message WHERE helpSessionId = ? AND `read` = FALSE ORDER BY createdAt ASC",
    [helpSessionId]
  );
}

/**
 * Count unread messages for a help session
 */
export async function countUnreadMessagesByHelpSession(helpSessionId) {
  const result = await query(
    "SELECT COUNT(*) as count FROM Message WHERE helpSessionId = ? AND `read` = FALSE",
    [helpSessionId]
  );
  return result[0].count;
}

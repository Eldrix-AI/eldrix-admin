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
 * Get all messages
 */
export async function getAllMessages() {
  return await query('SELECT * FROM "Message"');
}

/**
 * Get all messages for a help session
 */
export async function getMessagesByHelpSessionId(helpSessionId) {
  return await query(
    'SELECT * FROM "Message" WHERE "helpSessionId" = $1 ORDER BY "createdAt" ASC',
    [helpSessionId]
  );
}

/**
 * Get a message by ID
 */
export async function getMessageById(id) {
  const messages = await query('SELECT * FROM "Message" WHERE id = $1', [id]);
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
    `INSERT INTO "Message" (id, content, "isAdmin", "helpSessionId", "read", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, content, isAdmin, helpSessionId, read, createdAt]
  );

  console.log("Message created:", result);
  return result[0];
}

/**
 * Delete a message
 */
export async function deleteMessage(id) {
  const result = await pool.query('DELETE FROM "Message" WHERE id = $1', [id]);
  return result.rowCount > 0;
}

/**
 * Get recent messages
 */
export async function getRecentMessages(limit = 10) {
  return await query(
    'SELECT * FROM "Message" ORDER BY "createdAt" DESC LIMIT $1',
    [limit]
  );
}

/**
 * Count messages by help session
 */
export async function countMessagesByHelpSession(helpSessionId) {
  const result = await query(
    'SELECT COUNT(*)::int as count FROM "Message" WHERE "helpSessionId" = $1',
    [helpSessionId]
  );
  return result[0].count;
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(id) {
  const result = await pool.query(
    'UPDATE "Message" SET "read" = TRUE WHERE id = $1',
    [id]
  );
  return result.rowCount > 0;
}

/**
 * Mark all messages in a help session as read
 */
export async function markAllSessionMessagesAsRead(helpSessionId) {
  const result = await pool.query(
    'UPDATE "Message" SET "read" = TRUE WHERE "helpSessionId" = $1',
    [helpSessionId]
  );
  return result.rowCount;
}

/**
 * Get unread messages for a help session
 */
export async function getUnreadMessagesByHelpSessionId(helpSessionId) {
  return await query(
    'SELECT * FROM "Message" WHERE "helpSessionId" = $1 AND "read" = FALSE ORDER BY "createdAt" ASC',
    [helpSessionId]
  );
}

/**
 * Count unread messages for a help session
 */
export async function countUnreadMessagesByHelpSession(helpSessionId) {
  const result = await query(
    'SELECT COUNT(*)::int as count FROM "Message" WHERE "helpSessionId" = $1 AND "read" = FALSE',
    [helpSessionId]
  );
  return result[0].count;
}

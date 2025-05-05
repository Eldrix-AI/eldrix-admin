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
 * Get all help sessions
 */
export async function getAllHelpSessions() {
  return await query("SELECT * FROM HelpSession");
}

/**
 * Get all help sessions for a user
 */
export async function getHelpSessionsByUserId(userId) {
  return await query("SELECT * FROM HelpSession WHERE userId = ?", [userId]);
}

/**
 * Get a help session by ID
 */
export async function getHelpSessionById(id) {
  const sessions = await query("SELECT * FROM HelpSession WHERE id = ?", [id]);
  return sessions[0] || null;
}

/**
 * Create a new help session
 */
export async function createHelpSession(sessionData) {
  const {
    id,
    userId,
    title = "",
    sessionRecap = null,
    completed = false,
    lastMessage = null,
    type,
    status = "pending",
    priority = "",
    createdAt = new Date(),
    updatedAt = new Date(),
  } = sessionData;

  const result = await query(
    `INSERT INTO HelpSession (id, userId, title, sessionRecap, completed, lastMessage, type, status, priority, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      title,
      sessionRecap,
      completed,
      lastMessage,
      type,
      status,
      priority,
      createdAt,
      updatedAt,
    ]
  );

  console.log("Help session created:", result);
  return { id, ...sessionData };
}

/**
 * Update a help session
 */
export async function updateHelpSession(id, sessionData) {
  const fields = Object.keys(sessionData);
  const values = Object.values(sessionData);

  // Add updatedAt field
  fields.push("updatedAt");
  values.push(new Date());

  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const result = await query(
    `UPDATE HelpSession SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  console.log("Help session updated:", result);
  return { id, ...sessionData, updatedAt: new Date() };
}

/**
 * Delete a help session
 */
export async function deleteHelpSession(id) {
  const result = await query("DELETE FROM HelpSession WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Get recently created help sessions
 */
export async function getRecentHelpSessions(limit = 10) {
  return await query(
    "SELECT * FROM HelpSession ORDER BY createdAt DESC LIMIT ?",
    [limit]
  );
}

/**
 * Count help sessions by status
 */
export async function countHelpSessionsByStatus(status) {
  const result = await query(
    "SELECT COUNT(*) as count FROM HelpSession WHERE status = ?",
    [status]
  );
  return result[0].count;
}

/**
 * Get a help session with its associated messages
 */
export async function getHelpSessionWithMessages(sessionId) {
  // Get the help session first
  const session = await getHelpSessionById(sessionId);

  if (!session) {
    return null;
  }

  // Get associated messages
  const messages = await query(
    "SELECT * FROM Message WHERE helpSessionId = ? ORDER BY createdAt ASC",
    [sessionId]
  );

  // Return the session with messages
  return {
    ...session,
    messages,
  };
}

/**
 * Get all help sessions with their associated messages
 */
export async function getAllHelpSessionsWithMessages() {
  // Get all help sessions
  const sessions = await getAllHelpSessions();

  // For each session, get the messages
  const sessionsWithMessages = await Promise.all(
    sessions.map(async (session) => {
      const messages = await query(
        "SELECT * FROM Message WHERE helpSessionId = ? ORDER BY createdAt ASC",
        [session.id]
      );

      return {
        ...session,
        messages,
      };
    })
  );

  return sessionsWithMessages;
}

/**
 * Get help sessions with their messages for a specific user
 */
export async function getHelpSessionsWithMessagesByUserId(userId) {
  // Get all help sessions for the user
  const sessions = await getHelpSessionsByUserId(userId);

  // For each session, get the messages
  const sessionsWithMessages = await Promise.all(
    sessions.map(async (session) => {
      const messages = await query(
        "SELECT * FROM Message WHERE helpSessionId = ? ORDER BY createdAt ASC",
        [session.id]
      );

      return {
        ...session,
        messages,
      };
    })
  );

  return sessionsWithMessages;
}

/**
 * Get help sessions from the last 24 hours
 */
export async function getLastDayHelpSessions(userId) {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return await query(
    "SELECT * FROM HelpSession WHERE userId = ? AND createdAt >= ? ORDER BY createdAt DESC",
    [userId, oneDayAgo]
  );
}

/**
 * Get help sessions from the last 7 days
 */
export async function getLastWeekHelpSessions(userId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return await query(
    "SELECT * FROM HelpSession WHERE userId = ? AND createdAt >= ? AND createdAt < ? ORDER BY createdAt DESC",
    [userId, oneWeekAgo, getOneDayAgo()]
  );
}

/**
 * Get help sessions from the last 30 days (excluding last 7 days)
 */
export async function getLastMonthHelpSessions(userId) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return await query(
    "SELECT * FROM HelpSession WHERE userId = ? AND createdAt >= ? AND createdAt < ? ORDER BY createdAt DESC",
    [userId, oneMonthAgo, oneWeekAgo]
  );
}

/**
 * Get help sessions older than 30 days
 */
export async function getOlderHelpSessions(userId) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  return await query(
    "SELECT * FROM HelpSession WHERE userId = ? AND createdAt < ? ORDER BY createdAt DESC",
    [userId, oneMonthAgo]
  );
}

/**
 * Get number of sessions used in current week (Monday - Sunday)
 */
export async function getWeeklySessionCount(userId) {
  // Get the start of the current week (Monday)
  const currentDate = new Date();
  const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Monday start

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // Get sessions created this week
  const sessionsThisWeek = await query(
    "SELECT COUNT(*) as count FROM HelpSession WHERE userId = ? AND createdAt >= ? AND createdAt < ?",
    [userId, startOfWeek, endOfWeek]
  );

  return sessionsThisWeek[0].count;
}

/**
 * Calculate average session duration
 */
export async function getAverageSessionDuration(userId) {
  // Try to get all completed sessions
  const completedSessions = await query(
    "SELECT *, TIMESTAMPDIFF(MINUTE, createdAt, updatedAt) as sessionDuration FROM HelpSession WHERE userId = ? AND completed = 1",
    [userId]
  );

  if (completedSessions.length === 0) {
    return 0;
  }

  // Calculate average duration using createdAt and updatedAt timestamps
  let totalDuration = 0;
  let validSessions = 0;

  for (const session of completedSessions) {
    // If we have a sessionDuration calculated by MySQL, use it
    if (session.sessionDuration > 0) {
      totalDuration += session.sessionDuration;
      validSessions++;
    } else {
      // Fallback to calculating duration from messages if available
      const messages = await query(
        "SELECT MIN(createdAt) as firstMessage, MAX(createdAt) as lastMessage FROM Message WHERE helpSessionId = ?",
        [session.id]
      );

      if (messages[0].firstMessage && messages[0].lastMessage) {
        const startTime = new Date(messages[0].firstMessage).getTime();
        const endTime = new Date(messages[0].lastMessage).getTime();
        const duration = Math.floor((endTime - startTime) / 60000); // Minutes

        // Only count sessions with meaningful duration (more than 1 minute)
        if (duration > 1) {
          totalDuration += duration;
          validSessions++;
        }
      }
    }
  }

  return validSessions > 0 ? Math.floor(totalDuration / validSessions) : 0; // Return average in minutes
}

/**
 * Get helper function for one day ago
 */
function getOneDayAgo() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return oneDayAgo;
}

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

export async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    // Ensure no undefined values in params
    const safeParams = params.map((param) =>
      param === undefined ? null : param
    );

    // Log query for debugging (in development only)
    if (process.env.NODE_ENV !== "production") {
      console.log("SQL:", sql);
      console.log("Params:", JSON.stringify(safeParams));
    }

    const result = await pool.query(sql, safeParams);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function getUserById(id: string) {
  const users = await query<any>('SELECT * FROM "User" WHERE id = $1', [id]);
  return users[0] || null;
}

export async function getUserByEmail(email: string) {
  const users = await query<any>('SELECT * FROM "User" WHERE email = $1', [
    email,
  ]);
  return users[0] || null;
}

export async function createUser(userData: any) {
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
    preferredContactMethod = "phone",
    experienceLevel = "beginner",
  } = userData;

  const result = await query(
    `INSERT INTO "User" (id, name, email, password, phone, "imageUrl", description, 
     "smsConsent", "emailList", age, "techUsage", "accessibilityNeeds", 
     "preferredContactMethod", "experienceLevel", notification, "darkMode")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
      false, // notification default
      false, // darkMode default
    ]
  );

  console.log("User created:", result);

  return result[0];
}

export async function updateUser(id: string, userData: any) {
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

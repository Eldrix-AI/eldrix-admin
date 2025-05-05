import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
  port: parseInt(process.env.DB_PORT || "3306"),
  connectionLimit: 10,
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

    const [rows] = (await pool.execute(sql, safeParams)) as [T[], any];
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function getUserById(id: string) {
  const users = await query<any>("SELECT * FROM User WHERE id = ?", [id]);
  return users[0] || null;
}

export async function getUserByEmail(email: string) {
  const users = await query<any>("SELECT * FROM User WHERE email = ?", [email]);
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

export async function updateUser(id: string, userData: any) {
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

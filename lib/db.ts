import mysql from "mysql2/promise";

// Define User interface
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  imageUrl: string | null;
  description: string;
  smsConsent: boolean;
  emailList: boolean;
  age: number | null;
  techUsage: string | null;
  accessibilityNeeds: string | null;
  preferredContactMethod: string;
  experienceLevel: string;
}

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
  port: parseInt(process.env.DB_PORT || "3306"),
  connectionLimit: 10,
});

export async function query<T>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
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

    const [rows] = await pool.execute(sql, safeParams);
    return rows as unknown as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await query<User>("SELECT * FROM User WHERE id = ?", [id]);
  return users[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await query<User>("SELECT * FROM User WHERE email = ?", [
    email,
  ]);
  return users[0] || null;
}

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  imageUrl?: string;
  description?: string;
  smsConsent: boolean;
  emailList: boolean;
  age?: number | null;
  techUsage?: string | null;
  accessibilityNeeds?: string | null;
  preferredContactMethod?: string;
  experienceLevel?: string;
}

export async function createUser(userData: CreateUserData): Promise<User> {
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

  return {
    id,
    name,
    email,
    password,
    phone: phone || null,
    imageUrl: imageUrl || null,
    description,
    smsConsent,
    emailList,
    age,
    techUsage,
    accessibilityNeeds,
    preferredContactMethod,
    experienceLevel,
  };
}

export type UpdateUserData = Partial<Omit<User, "id">>;

export async function updateUser(
  id: string,
  userData: UpdateUserData
): Promise<Partial<User>> {
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

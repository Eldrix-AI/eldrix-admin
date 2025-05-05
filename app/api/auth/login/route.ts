import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if environment variables are set
    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate username and password
    if (username === adminUsername && password === adminPassword) {
      // Authentication successful
      const response = NextResponse.json({ success: true }, { status: 200 });

      // Set authentication cookie (secure, HTTP-only)
      response.cookies.set({
        name: "isAuthenticated",
        value: "true",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        // Expire in 7 days
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    } else {
      // Authentication failed
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}

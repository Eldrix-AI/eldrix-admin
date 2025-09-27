import { helpSessions } from "../../../../../../db/index.mjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if the user is authenticated via cookies
    const isAuthenticated = request.cookies.has("isAuthenticated");

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get user ID from URL
    const pathname = request.nextUrl.pathname;
    const pathParts = pathname.split("/");
    const userId = pathParts[pathParts.length - 2]; // Get the user ID from the path

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all help sessions for this user
    const allSessions = await helpSessions.getAllHelpSessionsWithMessages();

    // Filter sessions for this specific user
    const userSessions = allSessions.filter(
      (session: any) => session.userId === userId
    );

    // Sort sessions by creation date (newest first)
    const sortedSessions = userSessions.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(sortedSessions);
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    return NextResponse.json(
      { message: "Failed to fetch user conversations" },
      { status: 500 }
    );
  }
}

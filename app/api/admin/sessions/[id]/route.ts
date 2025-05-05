import { helpSessions } from "../../../../../db/index.mjs";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching a specific help session with its messages
 */
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

    // Get session ID directly from URL
    const pathname = request.nextUrl.pathname;
    const sessionId = pathname.split("/").pop() || "";

    if (!sessionId) {
      return NextResponse.json(
        { message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get help session with its messages
    const session = await helpSessions.getHelpSessionWithMessages(sessionId);

    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { message: "Failed to fetch help session" },
      { status: 500 }
    );
  }
}

import { helpSessions } from "../../../../db/index.mjs";
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

    // Get all help sessions with their messages
    const sessions = await helpSessions.getAllHelpSessionsWithMessages();

    // Fix data inconsistency: if status is "open" but completed is true, set completed to false
    const fixedSessions = await Promise.all(
      sessions.map(async (session: any) => {
        if (session.status === "open" && session.completed === true) {
          console.log(
            `Fixing session ${session.id}: status is open but completed is true`
          );
          await helpSessions.updateHelpSession(session.id, {
            completed: false,
          });
          return { ...session, completed: false };
        }
        return session;
      })
    );

    // Sort sessions: open first, then pending, then completed
    const sortedSessions = fixedSessions.sort(
      (
        a: {
          status: string;
          completed: boolean;
          updatedAt: string | number | Date;
        },
        b: {
          status: string;
          completed: boolean;
          updatedAt: string | number | Date;
        }
      ) => {
        // If a is open and b is not open, a comes first
        if (a.status === "open" && b.status !== "open") return -1;
        // If b is open and a is not open, b comes first
        if (b.status === "open" && a.status !== "open") return 1;

        // If a is pending and b is completed, a comes first
        if (a.status === "pending" && b.completed) return -1;
        // If b is pending and a is completed, b comes first
        if (b.status === "pending" && a.completed) return 1;

        // If both have the same status category (open, pending, or completed),
        // sort by updatedAt timestamp (newest first)
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    );

    return NextResponse.json(sortedSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { message: "Failed to fetch help sessions" },
      { status: 500 }
    );
  }
}

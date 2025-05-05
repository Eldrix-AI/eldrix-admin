import { helpSessions } from "../../../../db/index.mjs";
import { messages } from "../../../../db/index.mjs";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

interface MessageData {
  id: string;
  helpSessionId: string;
  content: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    // Check if the user is authenticated via cookies
    const isAuthenticated = request.cookies.has("isAuthenticated");

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { helpSessionId, content, isAdmin = true } = await request.json();

    if (!helpSessionId || !content) {
      return NextResponse.json(
        { message: "Session ID and message content are required" },
        { status: 400 }
      );
    }

    // Check if the session exists
    const session = await helpSessions.getHelpSessionById(helpSessionId);

    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    // Check if the session is completed
    if (session.completed) {
      return NextResponse.json(
        { message: "Cannot add messages to a completed session" },
        { status: 400 }
      );
    }

    // Create message
    const messageData = {
      id: uuidv4(),
      helpSessionId,
      content,
      isAdmin,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newMessage = await messages.createMessage(messageData);

    // Update session fields
    const updateData: any = {
      lastMessage: content,
      updatedAt: new Date(),
    };

    // If this is an admin message and the session is still pending, update to "open"
    if (isAdmin && session.status === "pending") {
      updateData.status = "open";
      console.log(
        `Updating session ${helpSessionId} status from pending to open`
      );
    }

    // Update session
    await helpSessions.updateHelpSession(helpSessionId, updateData);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
}

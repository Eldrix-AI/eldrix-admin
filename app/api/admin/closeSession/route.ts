import { NextRequest, NextResponse } from "next/server";
import { helpSessions, messages } from "../../../../db/index.mjs";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST handler for closing a help session
 */
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

    // Parse the request body
    const body = await request.json();
    const { helpSessionId, customRecap } = body;

    if (!helpSessionId) {
      return NextResponse.json(
        { error: "Help session ID is required" },
        { status: 400 }
      );
    }

    // Get the help session
    const helpSession = await helpSessions.getHelpSessionById(helpSessionId);

    if (!helpSession) {
      return NextResponse.json(
        { error: "Help session not found" },
        { status: 404 }
      );
    }

    // Get all messages in the session
    const sessionData = await helpSessions.getHelpSessionWithMessages(
      helpSessionId
    );
    const allMessages = sessionData.messages;

    let sessionRecap = customRecap;
    let newTitle = helpSession.title;

    // If no custom recap is provided, generate one using OpenAI
    if (!customRecap) {
      // Format messages for GPT prompt
      const formattedMessages = allMessages
        .map(
          (msg: { isAdmin: any; content: any }) =>
            `${msg.isAdmin ? "Support Agent" : "User"}: ${msg.content}`
        )
        .join("\n\n");

      // Generate session recap using GPT-4o
      const recapPrompt = `
        Please create a concise summary (maximum 3-4 sentences) of the following tech support conversation.
        Focus on:
        1. The main problem or question the user had
        2. The key solutions or advice provided
        3. Any next steps or unresolved issues
        
        CONVERSATION:
        ${formattedMessages}
        
        SUMMARY:
      `;

      const titlePrompt = `
        Based on the following tech support conversation, create a short, descriptive title (5-7 words max) 
        that clearly identifies the main topic or issue discussed.
        
        CONVERSATION:
        ${formattedMessages}
        
        TITLE:
      `;

      try {
        // Get both recap and title in parallel
        const [recapResponse, titleResponse] = await Promise.all([
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: recapPrompt }],
            max_tokens: 150,
            temperature: 0.7,
          }),
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: titlePrompt }],
            max_tokens: 25,
            temperature: 0.7,
          }),
        ]);

        sessionRecap = recapResponse.choices[0].message.content?.trim();
        newTitle = titleResponse.choices[0].message.content?.trim();
      } catch (error) {
        console.error("Error generating AI recap:", error);
        // Fallback if AI generation fails
        sessionRecap = "Session closed by admin.";
      }
    }

    // Update the help session
    const updatedSession = await helpSessions.updateHelpSession(helpSessionId, {
      completed: true,
      sessionRecap,
      title: newTitle || helpSession.title,
      status: "completed",
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
      recap: sessionRecap,
      title: newTitle,
    });
  } catch (error) {
    console.error("Error closing session:", error);
    return NextResponse.json(
      { error: "Failed to close session" },
      { status: 500 }
    );
  }
}

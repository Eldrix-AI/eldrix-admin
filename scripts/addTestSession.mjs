#!/usr/bin/env node

import { v4 as uuidv4 } from "uuid";
import { helpSessions, messages } from "../db/index.mjs";

async function addTestHelpSession() {
  try {
    console.log("Creating a test help session...");

    // Create session ID
    const sessionId = uuidv4();

    // Add test help session
    const session = await helpSessions.createHelpSession({
      id: sessionId,
      userId: "0c5f9cbe-5003-4061-9ca4-39235206c299", // Existing user ID from the database
      title: "Test Help Session",
      type: "general",
      priority: "medium",
      lastMessage: "This is the latest message in the session",
      status: "open",
    });

    console.log("\nHelp session created successfully:");
    console.log(JSON.stringify(session, null, 2));

    // Add a test message to the session
    const messageId = uuidv4();
    const message = await messages.createMessage({
      id: messageId,
      content: "Hello, this is a test message for the help session.",
      isAdmin: false,
      helpSessionId: sessionId,
      read: false,
    });

    console.log("\nMessage added successfully:");
    console.log(JSON.stringify(message, null, 2));

    // Add another message from admin
    const adminMessageId = uuidv4();
    const adminMessage = await messages.createMessage({
      id: adminMessageId,
      content: "Thank you for your message. How can I help you today?",
      isAdmin: true,
      helpSessionId: sessionId,
      read: false,
    });

    console.log("\nAdmin message added successfully:");
    console.log(JSON.stringify(adminMessage, null, 2));

    console.log("\nTest data creation completed successfully!");
  } catch (error) {
    console.error("Error creating test data:", error);
    process.exit(1);
  }
}

addTestHelpSession();

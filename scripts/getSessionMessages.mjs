#!/usr/bin/env node

import { helpSessions } from "../db/index.mjs";

// Check if a sessionId was provided
if (process.argv.length < 3) {
  console.error("Usage: node getSessionMessages.mjs <sessionId>");
  process.exit(1);
}

const sessionId = process.argv[2];

async function getSessionWithMessages() {
  try {
    console.log(`Fetching help session with ID: ${sessionId}`);

    // Get the help session with messages
    const sessionWithMessages = await helpSessions.getHelpSessionWithMessages(
      sessionId
    );

    if (!sessionWithMessages) {
      console.error(`No help session found with ID: ${sessionId}`);
      process.exit(1);
    }

    // Print session details
    console.log("\n=== HELP SESSION DETAILS ===");
    console.log(JSON.stringify(sessionWithMessages, null, 2));

    // Print message count
    console.log(`\nTotal messages: ${sessionWithMessages.messages.length}`);

    // Print individual messages in a more readable format
    console.log("\n=== MESSAGES ===");
    sessionWithMessages.messages.forEach((message, index) => {
      console.log(`\n--- Message ${index + 1} ---`);
      console.log(`From: ${message.isAdmin ? "Admin" : "User"}`);
      console.log(`Time: ${new Date(message.createdAt).toLocaleString()}`);
      console.log(`Content: ${message.content}`);
    });
  } catch (error) {
    console.error("Error fetching session with messages:", error);
    process.exit(1);
  }
}

getSessionWithMessages();

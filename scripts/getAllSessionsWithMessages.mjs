#!/usr/bin/env node

import { helpSessions } from "../db/index.mjs";

async function getAllSessionsWithMessages() {
  try {
    console.log("Fetching all help sessions with messages...");

    // Get all help sessions with their messages
    const sessionsWithMessages =
      await helpSessions.getAllHelpSessionsWithMessages();

    if (sessionsWithMessages.length === 0) {
      console.log("No help sessions found in the database.");
      process.exit(0);
    }

    // Print summary
    console.log(`\nFound ${sessionsWithMessages.length} help sessions.`);

    // Print details for each session
    sessionsWithMessages.forEach((session, index) => {
      console.log(`\n=== HELP SESSION ${index + 1} ===`);
      console.log(`ID: ${session.id}`);
      console.log(`User ID: ${session.userId}`);
      console.log(`Type: ${session.type}`);
      console.log(`Created: ${new Date(session.createdAt).toLocaleString()}`);
      console.log(`Updated: ${new Date(session.updatedAt).toLocaleString()}`);
      console.log(`Completed: ${session.completed ? "Yes" : "No"}`);
      console.log(`Last Message: ${session.lastMessage || "None"}`);
      console.log(`Session Recap: ${session.sessionRecap || "None"}`);

      // Print message count
      console.log(`\nMessages (${session.messages.length}):`);

      // Print individual messages
      if (session.messages.length > 0) {
        session.messages.forEach((message, msgIndex) => {
          console.log(`\n--- Message ${msgIndex + 1} ---`);
          console.log(`From: ${message.isAdmin ? "Admin" : "User"}`);
          console.log(`Time: ${new Date(message.createdAt).toLocaleString()}`);
          console.log(`Content: ${message.content}`);
        });
      } else {
        console.log("No messages in this session.");
      }

      console.log("\n--------------------------------");
    });
  } catch (error) {
    console.error("Error fetching sessions with messages:", error);
    process.exit(1);
  }
}

getAllSessionsWithMessages();

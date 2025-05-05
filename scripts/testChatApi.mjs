#!/usr/bin/env node

import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000/api";

// Test user - replace with an actual user ID from your database
const USER_ID = "0c5f9cbe-5003-4061-9ca4-39235206c299";

// Function to simulate a user sending a message
async function sendMessage(message, helpSessionId = null) {
  try {
    console.log(
      `\nSending message: "${message}"${
        helpSessionId ? " to existing session" : ""
      }`
    );

    const formData = new FormData();
    formData.append("message", message);

    if (helpSessionId) {
      formData.append("helpSessionId", helpSessionId);
    }

    // In a real environment, this would be authenticated with session cookies
    // For this test, we're directly accessing the database functions

    // Instead of making a real HTTP request, we'll simulate the API logic
    const { helpSessions, messages } = await import("../db/index.mjs");

    let sessionId = helpSessionId;
    let currentSession = null;

    if (!sessionId) {
      // Create a new help session
      sessionId = uuidv4();
      const title =
        message.length > 50 ? message.substring(0, 47) + "..." : message;

      currentSession = await helpSessions.createHelpSession({
        id: sessionId,
        userId: USER_ID,
        title,
        type: "general",
        priority: "medium",
        lastMessage: message,
        status: "pending",
      });

      console.log("Created new help session:", sessionId);
    } else {
      // Update existing session
      currentSession = await helpSessions.getHelpSessionById(sessionId);

      if (!currentSession) {
        console.error("Help session not found:", sessionId);
        return null;
      }

      await helpSessions.updateHelpSession(sessionId, {
        lastMessage: message,
      });

      console.log("Updated existing help session:", sessionId);
    }

    // Add the message
    const messageId = uuidv4();
    await messages.createMessage({
      id: messageId,
      content: message,
      isAdmin: false,
      helpSessionId: sessionId,
      read: false,
    });

    console.log("Added message:", messageId);

    // Get the updated session with messages
    const updatedSession = await helpSessions.getHelpSessionWithMessages(
      sessionId
    );
    console.log(`Session now has ${updatedSession.messages.length} messages`);

    return {
      sessionId,
      messageId,
      session: updatedSession,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}

// Function to simulate an admin reply
async function sendAdminReply(helpSessionId, message) {
  try {
    console.log(
      `\nSending admin reply: "${message}" to session ${helpSessionId}`
    );

    // Similar to the sendMessage function, we'll simulate the API logic directly
    const { helpSessions, messages } = await import("../db/index.mjs");

    // Check if help session exists
    const helpSession = await helpSessions.getHelpSessionById(helpSessionId);
    if (!helpSession) {
      console.error("Help session not found:", helpSessionId);
      return null;
    }

    // Add admin message
    const messageId = uuidv4();
    await messages.createMessage({
      id: messageId,
      content: message,
      isAdmin: true,
      helpSessionId,
      read: false,
    });

    console.log("Added admin message:", messageId);

    // Update session
    await helpSessions.updateHelpSession(helpSessionId, {
      lastMessage: message,
      status: "active",
    });

    // Mark previous messages as read
    await messages.markAllSessionMessagesAsRead(helpSessionId);
    console.log("Marked all previous messages as read");

    // Get updated session
    const updatedSession = await helpSessions.getHelpSessionWithMessages(
      helpSessionId
    );
    console.log(`Session now has ${updatedSession.messages.length} messages`);

    return {
      messageId,
      session: updatedSession,
    };
  } catch (error) {
    console.error("Error sending admin reply:", error);
    return null;
  }
}

// Run the test
async function runTest() {
  try {
    console.log("=== TESTING CHAT API FUNCTIONALITY ===");

    // Step 1: Send initial message from user
    const initialResult = await sendMessage(
      "Hello, I need help with my smartphone. The battery drains too quickly."
    );
    if (!initialResult) {
      throw new Error("Failed to send initial message");
    }

    const { sessionId } = initialResult;
    console.log("Created help session with ID:", sessionId);

    // Step 2: Send admin reply
    const adminReply1 = await sendAdminReply(
      sessionId,
      "Hello! I'd be happy to help with your battery issue. What kind of smartphone do you have?"
    );
    if (!adminReply1) {
      throw new Error("Failed to send admin reply");
    }

    // Step 3: Send follow-up message from user
    const followUpResult = await sendMessage(
      "I have an iPhone 12. It's about 2 years old.",
      sessionId
    );
    if (!followUpResult) {
      throw new Error("Failed to send follow-up message");
    }

    // Step 4: Send another admin reply
    const adminReply2 = await sendAdminReply(
      sessionId,
      "Thanks for the info. For iPhone 12 battery drain issues, I recommend checking which apps are using the most battery. Go to Settings > Battery and check the list. Would you like me to walk you through some battery-saving steps?"
    );
    if (!adminReply2) {
      throw new Error("Failed to send second admin reply");
    }

    // Step 5: Fetch and display the complete conversation
    const { helpSessions } = await import("../db/index.mjs");
    const finalSession = await helpSessions.getHelpSessionWithMessages(
      sessionId
    );

    console.log("\n=== COMPLETE CONVERSATION ===");
    console.log(`Session ID: ${finalSession.id}`);
    console.log(`Title: ${finalSession.title}`);
    console.log(`Status: ${finalSession.status}`);
    console.log(`Priority: ${finalSession.priority}`);
    console.log(`Messages: ${finalSession.messages.length}`);

    console.log("\n=== MESSAGES ===");
    finalSession.messages.forEach((msg, index) => {
      console.log(`\n[${index + 1}] From: ${msg.isAdmin ? "Admin" : "User"}`);
      console.log(`Time: ${new Date(msg.createdAt).toLocaleString()}`);
      console.log(`Read: ${msg.read ? "Yes" : "No"}`);
      console.log(`Content: ${msg.content}`);
    });

    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest();

// db/index.mjs - Main entry point for database functions

// Import all user-related functions
import * as users from "./users.mjs";

// Import all help session-related functions
import * as helpSessions from "./helpSessions.mjs";

// Import all message-related functions
import * as messages from "./messages.mjs";

// Import all tech usage-related functions
import * as techUsage from "./techUsage.mjs";

// Import deletion utilities
import * as deleteByIndex from "./deleteByIndex.mjs";
import * as deleteAll from "./deleteAll.mjs";

// Export everything
export default {
  users,
  helpSessions,
  messages,
  techUsage,
  deleteByIndex,
  deleteAll,
};

// Also export individual modules for direct imports
export { users, helpSessions, messages, techUsage, deleteByIndex, deleteAll };

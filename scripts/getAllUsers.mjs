// scripts/getAllUsers.mjs
import { users } from "../db/index.mjs";

async function main() {
  try {
    console.log("Fetching all users...");
    const allUsers = await users.getAllUsers();
    console.log("Total users found:", allUsers.length);
    console.log(JSON.stringify(allUsers, null, 2));
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    // Exit the process when done
    process.exit(0);
  }
}

main();

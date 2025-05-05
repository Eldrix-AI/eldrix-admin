// scripts/getTechUsage.mjs
import { techUsage, users } from "../db/index.mjs";

async function main() {
  try {
    // First, get all users
    console.log("Fetching all users...");
    const allUsers = await users.getAllUsers();
    console.log("Total users found:", allUsers.length);

    // Then, get all tech usage entries
    console.log("\nFetching all tech usage entries...");
    const allTechUsage = await techUsage.getAllTechUsages();
    console.log("Total tech usage entries:", allTechUsage.length);

    if (allTechUsage.length > 0) {
      console.log("\nTech usage data:");
      console.log(JSON.stringify(allTechUsage, null, 2));
    } else {
      console.log("\nNo tech usage data found.");
    }

    // For each user, get their tech usage
    console.log("\nFetching tech usage by user:");
    for (const user of allUsers) {
      const userTechUsage = await techUsage.getTechUsagesByUserId(user.id);
      console.log(`\nUser: ${user.name} (${user.email})`);
      console.log(`Tech usage items: ${userTechUsage.length}`);

      if (userTechUsage.length > 0) {
        console.log(JSON.stringify(userTechUsage, null, 2));
      } else {
        console.log("No tech usage data for this user");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Exit the process when done
    process.exit(0);
  }
}

main();

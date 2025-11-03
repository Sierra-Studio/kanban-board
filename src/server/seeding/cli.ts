#!/usr/bin/env node

/**
 * CLI script for running database seeding
 * Usage: npm run db:seed
 */

import { runSeedingAndExit } from "./index";

console.log("🌱 Kanban Database Seeding CLI");
console.log("==============================");

// Run the seeding process
runSeedingAndExit().catch((error) => {
  console.error("💥 Unexpected error in seeding CLI:", error);
  process.exit(1);
});
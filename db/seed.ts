import { getDb } from "../api/queries/connection";

async function seed() {
  console.log("Seeding database...");
  getDb();

  // The current MVP uses front-end demo data for the local single-user flow.
  // Keep this script as an explicit no-op until real seed fixtures are needed.

  console.log("Done.");
  process.exit(0); // close MySQL connection pool
}

seed();

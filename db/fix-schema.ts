import { createConnection } from "mysql2/promise";
import { env } from "../api/lib/env";

async function main() {
  const conn = await createConnection(env.databaseUrl);

  // Drop problematic table if exists
  await conn.execute("DROP TABLE IF EXISTS `ai_settings`");
  console.log("Dropped ai_settings if existed");

  // Recreate it cleanly
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`ai_settings\` (
      \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
      \`userId\` bigint unsigned NOT NULL,
      \`provider\` enum('openai','deepseek','custom') NOT NULL DEFAULT 'openai',
      \`apiKey\` varchar(500) DEFAULT NULL,
      \`baseUrl\` varchar(500) DEFAULT NULL,
      \`model\` varchar(100) DEFAULT NULL,
      \`isActive\` enum('yes','no') NOT NULL DEFAULT 'no',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`ai_settings_userId_unique\` (\`userId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("Created ai_settings table");

  await conn.end();
}

main().catch(console.error);

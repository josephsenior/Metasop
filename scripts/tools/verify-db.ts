/**
 * Verifies database connection and diagram create/update using the same
 * prisma and diagramDb modules as the Next.js API. Run from project root:
 *   pnpm exec tsx scripts/tools/verify-db.ts
 */
import { checkDatabaseHealth, getDatabaseInfo, prisma } from "../../lib/database/prisma";
import { diagramDb } from "../../lib/diagrams/db";

const TEST_USER_ID = "verify-db-test-user";

async function main() {
  console.log("1. Database info:", getDatabaseInfo());
  console.log("2. DATABASE_URL (first 60 chars):", (process.env.DATABASE_URL ?? "").slice(0, 60));

  const health = await checkDatabaseHealth();
  if (!health.healthy) {
    console.error("3. Health check FAILED:", health.error);
    process.exit(1);
  }
  console.log("3. Health check OK, latency:", health.latency, "ms");

  let diagramId: string | null = null;
  try {
    const created = await diagramDb.create(TEST_USER_ID, {
      prompt: "Verify DB create",
      options: {},
    });
    diagramId = created.id;
    console.log("4. diagramDb.create OK, id:", created.id);

    const updated = await diagramDb.update(created.id, TEST_USER_ID, {
      status: "completed",
      title: "Verify DB update",
    });
    console.log("5. diagramDb.update OK, title:", updated.title);

    const found = await diagramDb.findById(created.id, TEST_USER_ID);
    if (!found) {
      console.error("6. diagramDb.findById FAILED");
      process.exit(1);
    }
    console.log("6. diagramDb.findById OK");

    await diagramDb.delete(created.id, TEST_USER_ID);
    console.log("7. diagramDb.delete OK");
  } catch (err) {
    console.error("DB operation failed:", err);
    if (diagramId) {
      try {
        await diagramDb.delete(diagramId, TEST_USER_ID);
      } catch {
        // ignore
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nAll database checks passed.");
}

main();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking Prisma connection (SQLite)...");
    const diagramCount = await prisma.diagram.count();
    console.log(`Diagram count: ${diagramCount}`);
    console.log("Database check successful!");
  } catch (error) {
    console.error("Database check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

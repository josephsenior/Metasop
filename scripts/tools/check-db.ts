import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking Prisma connection...");
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    console.log("Checking Diagram model...");
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

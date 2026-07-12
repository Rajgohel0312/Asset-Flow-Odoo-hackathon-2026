import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "System Administration",
    },
  });
  await prisma.role.upsert({
    where: { name: "Employee" },
    update: {},
    create: {
      name: "Employee",
      description: "Default employee role",
    },
  });
  const password = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      firstName: "System",
      lastName: "Admin",
      email: "admin@example.com",
      password,
      roleId: adminRole.id,
    },
  });

  console.log("Seed completed.");
}

main().finally(() => prisma.$disconnect());

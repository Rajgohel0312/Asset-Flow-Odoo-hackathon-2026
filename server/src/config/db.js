import { PrismaClient } from "@prisma/client";

const prisma = PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});
export default prisma;
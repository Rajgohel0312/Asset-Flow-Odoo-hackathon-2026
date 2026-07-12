import prisma from '../config/db.js';

export const generateAuditNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await prisma.auditCycle.count();
  const nextNum = String(count + 1).padStart(4, '0');
  return `AUD-${currentYear}-${nextNum}`;
};

export default generateAuditNumber;

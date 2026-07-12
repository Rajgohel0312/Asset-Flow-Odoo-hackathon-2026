import prisma from '../config/db.js';

export const generateBookingNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await prisma.resourceBooking.count();
  const nextNum = String(count + 1).padStart(4, '0');
  return `BK-${currentYear}-${nextNum}`;
};

export default generateBookingNumber;

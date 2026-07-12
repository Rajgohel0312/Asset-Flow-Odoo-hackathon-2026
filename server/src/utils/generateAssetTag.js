import prisma from '../config/db.js';

export const generateAssetTag = async () => {
  const count = await prisma.asset.count();
  const nextNum = String(count + 1).padStart(6, '0');
  return `AF-${nextNum}`;
};

export default generateAssetTag;

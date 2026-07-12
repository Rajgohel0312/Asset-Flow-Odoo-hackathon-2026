import prisma from '../../config/db.js';

export const findByEmail = async (email) => {
  return await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
    include: {
      role: true,
      department: true,
    },
  });
};

export const findById = async (id) => {
  return await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      role: true,
      department: true,
    },
  });
};

export const create = async (userData) => {
  return await prisma.user.create({
    data: userData,
    include: {
      role: true,
      department: true,
    },
  });
};

export const updatePassword = async (id, hashedPassword) => {
  return await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
};

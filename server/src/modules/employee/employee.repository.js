import prisma from '../../config/db.js';

export const findById = async (id) => {
  return await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileImage: true,
      status: true,
      roleId: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      department: true,
    },
  });
};

export const findAll = async (params = {}) => {
  const { page = 1, limit = 10, search, departmentId, roleId, status } = params;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(roleId ? { roleId } : {}),
    ...(search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        status: true,
        roleId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
};

export const update = async (id, data) => {
  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileImage: true,
      status: true,
      roleId: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      department: true,
    },
  });
};

export const softDelete = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  });
};

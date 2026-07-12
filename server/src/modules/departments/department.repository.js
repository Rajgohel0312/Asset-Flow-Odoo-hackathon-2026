import prisma from '../../config/db.js';

export const create = async (data) => {
  return await prisma.department.create({
    data,
    include: {
      parentDepartment: true,
      departmentHead: true,
    },
  });
};

export const findById = async (id) => {
  return await prisma.department.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      parentDepartment: true,
      departmentHead: true,
      users: {
        where: { deletedAt: null },
      },
    },
  });
};

export const findAll = async (params = {}) => {
  const { page = 1, limit = 10, search } = params;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      skip,
      take: limit,
      include: {
        parentDepartment: true,
        departmentHead: true,
        _count: {
          select: { users: true, assets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.count({ where }),
  ]);

  return { data, total };
};

export const update = async (id, data) => {
  return await prisma.department.update({
    where: { id },
    data,
    include: {
      parentDepartment: true,
      departmentHead: true,
    },
  });
};

export const softDelete = async (id) => {
  return await prisma.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

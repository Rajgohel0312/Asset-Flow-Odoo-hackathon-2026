import prisma from '../../config/db.js';

export const findById = async (id) => {
  return await prisma.auditCycle.findUnique({
    where: { id },
    include: {
      department: true,
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      items: {
        include: {
          asset: true,
          auditor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
};

export const findAll = async (params = {}) => {
  const { page = 1, limit = 10, departmentId, status } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.auditCycle.findMany({
      where,
      skip,
      take: limit,
      include: {
        department: true,
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditCycle.count({ where }),
  ]);

  return { data, total };
};

import prisma from '../../config/db.js';

export const findById = async (id) => {
  return await prisma.assetAllocation.findUnique({
    where: { id },
    include: {
      asset: true,
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      approver: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
};

export const findActiveByAssetId = async (assetId) => {
  return await prisma.assetAllocation.findFirst({
    where: {
      assetId,
      status: 'ACTIVE',
    },
  });
};

export const findAll = async (params = {}) => {
  const { page = 1, limit = 10, employeeId, assetId, status } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(employeeId ? { employeeId } : {}),
    ...(assetId ? { assetId } : {}),
    ...(status ? { status } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.assetAllocation.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: true,
        employee: { select: { id: true, firstName: true, lastName: true, email: true, departmentId: true } },
        approver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { allocatedAt: 'desc' },
    }),
    prisma.assetAllocation.count({ where }),
  ]);

  return { data, total };
};

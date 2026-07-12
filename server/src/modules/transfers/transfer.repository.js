import prisma from '../../config/db.js';

export const findById = async (id) => {
  return await prisma.transferRequest.findUnique({
    where: { id },
    include: {
      asset: true,
      requester: { select: { id: true, firstName: true, lastName: true, email: true } },
      fromEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
      toEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
};

export const findAll = async (params = {}) => {
  const { page = 1, limit = 10, requestedBy, toEmployeeId, fromEmployeeId, status } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),
    ...(requestedBy ? { requestedBy } : {}),
    ...(toEmployeeId ? { toEmployeeId } : {}),
    ...(fromEmployeeId ? { fromEmployeeId } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.transferRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: true,
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        fromEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
        toEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transferRequest.count({ where }),
  ]);

  return { data, total };
};

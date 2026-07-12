import prisma from '../../config/db.js';

export const findById = async (id) => {
  return await prisma.maintenanceRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      asset: true,
      requester: { select: { id: true, firstName: true, lastName: true, email: true } },
      approver: { select: { id: true, firstName: true, lastName: true, email: true } },
      technician: { select: { id: true, firstName: true, lastName: true, email: true } },
      updates: {
        include: { updater: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

export const findAll = async (params = {}) => {
  const { page = 1, limit = 10, assetId, requestedBy, status, priority, technicianId } = params;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(assetId ? { assetId } : {}),
    ...(requestedBy ? { requestedBy } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(technicianId ? { technicianId } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.maintenanceRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: true,
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        technician: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  return { data, total };
};

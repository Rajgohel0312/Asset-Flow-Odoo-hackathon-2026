import prisma from '../../config/db.js';

export const findById = async (id) => {
  return await prisma.resourceBooking.findFirst({
    where: { id, deletedAt: null },
    include: {
      asset: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
};

export const findOverlapping = async (assetId, startTime, endTime, excludeBookingId = null) => {
  return await prisma.resourceBooking.findFirst({
    where: {
      assetId,
      status: { in: ['UPCOMING', 'ONGOING'] },
      deletedAt: null,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
};

export const findAll = async (params = {}) => {
  const { page = 1, limit = 10, assetId, bookedBy, status } = params;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(assetId ? { assetId } : {}),
    ...(bookedBy ? { bookedBy } : {}),
    ...(status ? { status } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.resourceBooking.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.resourceBooking.count({ where }),
  ]);

  return { data, total };
};

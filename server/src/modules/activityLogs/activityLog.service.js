import prisma from '../../config/db.js';

export const getActivityLogs = async (params, requester) => {
  const { page = 1, limit = 10, action, module, userId, search } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(action ? { action } : {}),
    ...(module ? { module } : {}),
  };

  if (requester.role.name === 'EMPLOYEE') {
    where.userId = requester.id;
  } else if (requester.role.name === 'DEPARTMENT_HEAD') {
    where.user = {
      departmentId: requester.departmentId,
    };
  } else if (userId) {
    where.userId = userId;
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { module: { contains: search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { data, total };
};

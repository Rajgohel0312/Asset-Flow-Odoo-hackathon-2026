import prisma from '../../config/db.js';
import logger from '../../config/logger.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';

export const log = async ({ userId, action, module, referenceId, oldData = null, newData = null, ipAddress = null, userAgent = null }) => {
  try {
    const logEntry = await prisma.activityLog.create({
      data: {
        userId,
        action,
        module,
        referenceId,
        oldData,
        newData,
        ipAddress,
        userAgent,
      },
    });
    logger.info(`Activity log entry created: [${module}] [${action}]`, { id: logEntry.id });
    return logEntry;
  } catch (err) {
    logger.error('Failed to write activity log entry', err);
  }
};

export const findAll = async (params, requester) => {
  const { page, limit, skip } = getPagination(params);
  const { action, module, userId, search, startDate, endDate } = params;

  const where = {
    ...(action ? { action } : {}),
    ...(module ? { module } : {}),
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      },
    } : {}),
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

  const sort = getSortQuery(params, 'createdAt', 'desc');

  const [data, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: sort,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { data, total };
};

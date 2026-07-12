import prisma from '../../config/db.js';
import logger from '../../config/logger.js';
import { getPagination } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export const createNotification = async ({ userId, title, message, type, referenceType = null, referenceId = null }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        referenceType,
        referenceId,
      },
    });
    logger.info(`Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (err) {
    logger.error(`Failed to create notification for user ${userId}`, err);
  }
};

export const getNotifications = async (userId, params = {}) => {
  const { page, limit, skip } = getPagination(params);
  const { isRead, type } = params;

  const where = {
    userId,
    ...(isRead !== undefined ? { isRead: isRead === 'true' || isRead === true } : {}),
    ...(type ? { type } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  return { data, total };
};

export const markAsRead = async (id, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to modify this notification');
  }

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

export const markAllRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const deleteNotification = async (id, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to delete this notification');
  }

  await prisma.notification.delete({
    where: { id },
  });

  return true;
};

export const countUnread = async (userId) => {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
};

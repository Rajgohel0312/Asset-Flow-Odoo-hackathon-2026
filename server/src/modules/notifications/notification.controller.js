import * as notificationService from './notification.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const getAll = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await notificationService.getNotifications(req.user.id, req.query);
  const unreadCount = await notificationService.countUnread(req.user.id);

  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
    unreadCount,
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Notifications list retrieved successfully', meta)
  );
});

export const read = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, notification, 'Notification marked as read successfully')
  );
});

export const readAll = asyncHandler(async (req, res, next) => {
  await notificationService.markAllRead(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, null, 'All notifications marked as read successfully')
  );
});

export const remove = asyncHandler(async (req, res, next) => {
  await notificationService.deleteNotification(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, null, 'Notification deleted successfully')
  );
});

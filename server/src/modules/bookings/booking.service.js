import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as activityLogService from '../activity-logs/activity-log.service.js';
import * as notificationService from '../notifications/notification.service.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';
import { generateBookingNumber } from '../../utils/generateBookingNumber.js';
import logger from '../../config/logger.js';

export const createBooking = async (data, userId) => {
  const { assetId, startTime, endTime, purpose } = data;

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
  });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  if (!asset.isBookable) {
    throw new ApiError(400, 'This asset is not designated as a shareable/bookable resource');
  }

  if (asset.status === 'UNDER_MAINTENANCE' || asset.status === 'LOST' || asset.status === 'RETIRED' || asset.status === 'DISPOSED') {
    throw new ApiError(400, `Asset is currently unavailable for booking. Status: ${asset.status}`);
  }

  const overlap = await prisma.resourceBooking.findFirst({
    where: {
      assetId,
      status: { in: ['UPCOMING', 'ONGOING'] },
      deletedAt: null,
      OR: [
        {
          startTime: { lte: new Date(startTime) },
          endTime: { gt: new Date(startTime) },
        },
        {
          startTime: { lt: new Date(endTime) },
          endTime: { gte: new Date(endTime) },
        },
        {
          startTime: { gte: new Date(startTime) },
          endTime: { lte: new Date(endTime) },
        },
      ],
    },
  });

  if (overlap) {
    throw new ApiError(409, 'Asset is already booked during this timeframe');
  }

  const bookingNumber = await generateBookingNumber();

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.resourceBooking.create({
      data: {
        bookingNumber,
        assetId,
        bookedBy: userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purpose,
        status: 'UPCOMING',
      },
      include: { asset: true, user: true },
    });

    await activityLogService.log({
      userId,
      action: 'BOOK',
      module: 'RESOURCE_BOOKING',
      referenceId: booking.id,
      newData: booking,
    });

    await notificationService.createNotification({
      userId,
      title: 'Booking Confirmed',
      message: `You have successfully reserved ${asset.assetName} [${asset.assetTag}] for ${new Date(startTime).toLocaleString()}. Ref: ${bookingNumber}`,
      type: 'BOOKING_CREATED',
      referenceType: 'BOOKING',
      referenceId: booking.id,
    });

    logger.info(`Booking created: ${bookingNumber} for asset ${asset.assetTag}`, { id: booking.id });
    return booking;
  });
};

export const getBookingById = async (id) => {
  const booking = await prisma.resourceBooking.findUnique({
    where: { id },
    include: {
      asset: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  return booking;
};

export const getAllBookings = async (params = {}, requester) => {
  const { page, limit, skip } = getPagination(params);
  const { status, assetId } = params;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(assetId ? { assetId } : {}),
  };

  if (requester.role.name === 'EMPLOYEE') {
    where.bookedBy = requester.id;
  } else if (requester.role.name === 'DEPARTMENT_HEAD') {
    where.asset = {
      departmentId: requester.departmentId,
    };
  }

  const sort = getSortQuery(params, 'startTime', 'desc');

  const [data, total] = await prisma.$transaction([
    prisma.resourceBooking.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: sort,
    }),
    prisma.resourceBooking.count({ where }),
  ]);

  return { data, total };
};

export const cancelBooking = async (id, requester) => {
  const booking = await prisma.resourceBooking.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    throw new ApiError(400, `Cannot cancel booking with current status: ${booking.status}`);
  }

  if (requester.role.name !== 'ADMIN' && requester.role.name !== 'ASSET_MANAGER' && booking.bookedBy !== requester.id) {
    throw new ApiError(403, 'Forbidden. You do not have permission to cancel this booking.');
  }

  const cancelled = await prisma.resourceBooking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { asset: true, user: true },
  });

  await activityLogService.log({
    userId: requester.id,
    action: 'CANCEL',
    module: 'RESOURCE_BOOKING',
    referenceId: id,
    oldData: booking,
    newData: cancelled,
  });

  await notificationService.createNotification({
    userId: booking.bookedBy,
    title: 'Booking Cancelled',
    message: `Your booking for ${booking.asset.assetName} [${booking.asset.assetTag}] has been cancelled.`,
    type: 'BOOKING_CANCELLED',
    referenceType: 'BOOKING',
    referenceId: id,
  });

  logger.info(`Booking cancelled: ${booking.bookingNumber}`, { id });
  return cancelled;
};

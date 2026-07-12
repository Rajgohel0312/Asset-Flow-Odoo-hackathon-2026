import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as activityLogService from '../activity-logs/activity-log.service.js';
import * as notificationService from '../notifications/notification.service.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';
import logger from '../../config/logger.js';

export const requestTransfer = async (data, requesterId) => {
  const { assetId, toEmployeeId, reason } = data;

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
  });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const currentAllocation = await prisma.assetAllocation.findFirst({
    where: { assetId, status: 'ACTIVE' },
  });

  const fromEmployeeId = currentAllocation ? currentAllocation.employeeId : null;

  if (toEmployeeId === fromEmployeeId) {
    throw new ApiError(400, 'Cannot transfer asset to the current holder');
  }

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId,
      requestedBy: requesterId,
      fromEmployeeId,
      toEmployeeId,
      reason,
      status: 'PENDING',
    },
    include: { asset: true, requester: true, toEmployee: true },
  });

  await activityLogService.log({
    userId: requesterId,
    action: 'TRANSFER',
    module: 'ASSET_TRANSFER',
    referenceId: transfer.id,
    newData: transfer,
  });

  const assetManagers = await prisma.user.findMany({
    where: { role: { name: 'ASSET_MANAGER' }, deletedAt: null },
  });

  for (const manager of assetManagers) {
    await notificationService.createNotification({
      userId: manager.id,
      title: 'Transfer Requested',
      message: `A transfer request for asset ${asset.assetName} [${asset.assetTag}] has been submitted.`,
      type: 'TRANSFER_REQUEST',
      referenceType: 'TRANSFER',
      referenceId: transfer.id,
    });
  }

  logger.info(`Transfer request created by user ${requesterId} for asset ${asset.assetTag}`, { id: transfer.id });
  return transfer;
};

export const approveTransfer = async (id, approverId) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id },
    include: { asset: true, toEmployee: true, fromEmployee: true },
  });
  if (!transfer) {
    throw new ApiError(404, 'Transfer request not found');
  }
  if (transfer.status !== 'PENDING') {
    throw new ApiError(400, 'Transfer request is already processed');
  }

  return await prisma.$transaction(async (tx) => {
    if (transfer.fromEmployeeId) {
      const activeAlloc = await tx.assetAllocation.findFirst({
        where: { assetId: transfer.assetId, employeeId: transfer.fromEmployeeId, status: 'ACTIVE' },
      });
      if (activeAlloc) {
        await tx.assetAllocation.update({
          where: { id: activeAlloc.id },
          data: {
            returnedAt: new Date(),
            returnNotes: `Transferred to employee ID: ${transfer.toEmployeeId}`,
            status: 'RETURNED',
          },
        });
      }
    }

    const newAllocation = await tx.assetAllocation.create({
      data: {
        assetId: transfer.assetId,
        employeeId: transfer.toEmployeeId,
        departmentId: transfer.toEmployee.departmentId,
        allocatedBy: approverId,
        status: 'ACTIVE',
      },
    });

    await tx.asset.update({
      where: { id: transfer.assetId },
      data: {
        departmentId: transfer.toEmployee.departmentId,
        status: 'ALLOCATED',
      },
    });

    const approved = await tx.transferRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });

    await activityLogService.log({
      userId: approverId,
      action: 'APPROVE',
      module: 'ASSET_TRANSFER',
      referenceId: id,
      oldData: transfer,
      newData: approved,
    });

    if (transfer.fromEmployeeId) {
      await notificationService.createNotification({
        userId: transfer.fromEmployeeId,
        title: 'Asset Transferred Out',
        message: `Your asset ${transfer.asset.assetName} [${transfer.asset.assetTag}] has been transferred to ${transfer.toEmployee.firstName} ${transfer.toEmployee.lastName}.`,
        type: 'TRANSFER_APPROVED',
        referenceType: 'TRANSFER',
        referenceId: id,
      });
    }

    await notificationService.createNotification({
      userId: transfer.toEmployeeId,
      title: 'Asset Transferred In',
      message: `Asset ${transfer.asset.assetName} [${transfer.asset.assetTag}] has been successfully transferred to you.`,
      type: 'TRANSFER_APPROVED',
      referenceType: 'TRANSFER',
      referenceId: id,
    });

    logger.info(`Transfer request approved by ${approverId} for asset ${transfer.asset.assetTag}`, { id });
    return approved;
  });
};

export const rejectTransfer = async (id, rejecterId) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!transfer) {
    throw new ApiError(404, 'Transfer request not found');
  }
  if (transfer.status !== 'PENDING') {
    throw new ApiError(400, 'Transfer request is already processed');
  }

  const rejected = await prisma.transferRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedBy: rejecterId,
      approvedAt: new Date(),
    },
  });

  await activityLogService.log({
    userId: rejecterId,
    action: 'REJECT',
    module: 'ASSET_TRANSFER',
    referenceId: id,
    oldData: transfer,
    newData: rejected,
  });

  await notificationService.createNotification({
    userId: transfer.requestedBy,
    title: 'Transfer Request Rejected',
    message: `Your transfer request for asset ${transfer.asset.assetName} [${transfer.asset.assetTag}] was rejected.`,
    type: 'TRANSFER_REJECTED',
    referenceType: 'TRANSFER',
    referenceId: id,
  });

  logger.info(`Transfer request rejected by ${rejecterId} for asset ${transfer.asset.assetTag}`, { id });
  return rejected;
};

export const getTransferById = async (id) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id },
    include: {
      asset: true,
      requester: { select: { id: true, firstName: true, lastName: true, email: true } },
      fromEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
      toEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
      approver: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!transfer) {
    throw new ApiError(404, 'Transfer request not found');
  }
  return transfer;
};

export const getAllTransfers = async (params = {}, requester) => {
  const { page, limit, skip } = getPagination(params);
  const { status, assetId } = params;

  const where = {
    ...(status ? { status } : {}),
    ...(assetId ? { assetId } : {}),
  };

  if (requester.role.name === 'EMPLOYEE') {
    where.OR = [
      { requestedBy: requester.id },
      { fromEmployeeId: requester.id },
      { toEmployeeId: requester.id },
    ];
  } else if (requester.role.name === 'DEPARTMENT_HEAD') {
    where.OR = [
      { toEmployee: { departmentId: requester.departmentId } },
      { fromEmployee: { departmentId: requester.departmentId } },
    ];
  }

  const sort = getSortQuery(params, 'createdAt', 'desc');

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
      orderBy: sort,
    }),
    prisma.transferRequest.count({ where }),
  ]);

  return { data, total };
};

import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as activityLogService from '../activity-logs/activity-log.service.js';
import * as notificationService from '../notifications/notification.service.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';
import logger from '../../config/logger.js';

export const requestMaintenance = async (data, requesterId) => {
  const { assetId, priority, issueDescription, photo } = data;

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
  });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  return await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: {
        assetId,
        requestedBy: requesterId,
        priority,
        issueDescription,
        photo,
        status: 'PENDING',
      },
      include: { asset: true, requester: true },
    });

    await activityLogService.log({
      userId: requesterId,
      action: 'CREATE',
      module: 'MAINTENANCE_REQUEST',
      referenceId: request.id,
      newData: request,
    });

    const managers = await tx.user.findMany({
      where: { role: { name: 'ASSET_MANAGER' }, deletedAt: null },
    });

    for (const mgr of managers) {
      await notificationService.createNotification({
        userId: mgr.id,
        title: 'New Maintenance Request',
        message: `A maintenance request has been raised for asset ${asset.assetName} [${asset.assetTag}].`,
        type: 'MAINTENANCE_CREATED',
        referenceType: 'MAINTENANCE',
        referenceId: request.id,
      });
    }

    logger.info(`Maintenance request created for asset ${asset.assetTag} by ${requesterId}`, { id: request.id });
    return request;
  });
};

export const approveRequest = async (id, approverId) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(400, 'Maintenance request is already approved/rejected');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
      },
    });

    await tx.asset.update({
      where: { id: request.assetId },
      data: { status: 'UNDER_MAINTENANCE' },
    });

    await activityLogService.log({
      userId: approverId,
      action: 'APPROVE',
      module: 'MAINTENANCE_REQUEST',
      referenceId: id,
      oldData: request,
      newData: updated,
    });

    await notificationService.createNotification({
      userId: request.requestedBy,
      title: 'Maintenance Approved',
      message: `Your maintenance request for asset ${request.asset.assetName} has been approved.`,
      type: 'MAINTENANCE_APPROVED',
      referenceType: 'MAINTENANCE',
      referenceId: id,
    });

    logger.info(`Maintenance request ${id} approved by ${approverId}`);
    return updated;
  });
};

export const rejectRequest = async (id, rejecterId) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }
  if (request.status !== 'PENDING') {
    throw new ApiError(400, 'Maintenance request is already processed');
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedBy: rejecterId,
    },
  });

  await activityLogService.log({
    userId: rejecterId,
    action: 'REJECT',
    module: 'MAINTENANCE_REQUEST',
    referenceId: id,
    oldData: request,
    newData: updated,
  });

  await notificationService.createNotification({
    userId: request.requestedBy,
    title: 'Maintenance Rejected',
    message: `Your maintenance request for asset ${request.asset.assetName} was rejected.`,
    type: 'MAINTENANCE_REJECTED',
    referenceType: 'MAINTENANCE',
    referenceId: id,
  });

  logger.info(`Maintenance request ${id} rejected by ${rejecterId}`);
  return updated;
};

export const assignTechnician = async (id, data, managerId) => {
  const { technicianId } = data;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }

  const tech = await prisma.user.findFirst({
    where: { id: technicianId, deletedAt: null },
  });
  if (!tech) {
    throw new ApiError(404, 'Technician employee not found');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        technicianId,
      },
    });

    await tx.maintenanceUpdate.create({
      data: {
        maintenanceRequestId: id,
        comment: `Technician ${tech.firstName} ${tech.lastName} assigned to work on the asset.`,
        status: 'ASSIGNED',
        updatedBy: managerId,
      },
    });

    await activityLogService.log({
      userId: managerId,
      action: 'UPDATE',
      module: 'MAINTENANCE_REQUEST',
      referenceId: id,
      oldData: request,
      newData: updated,
    });

    await notificationService.createNotification({
      userId: technicianId,
      title: 'Audit / Maintenance Assigned',
      message: `You have been assigned to resolve a maintenance issue for ${request.asset.assetName} [${request.asset.assetTag}].`,
      type: 'AUDIT_ASSIGNED',
      referenceType: 'MAINTENANCE',
      referenceId: id,
    });

    logger.info(`Technician ${technicianId} assigned to request ${id}`);
    return updated;
  });
};

export const addRequestUpdate = async (id, data, updaterId) => {
  const { comment, status } = data;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }

  return await prisma.$transaction(async (tx) => {
    const update = await tx.maintenanceUpdate.create({
      data: {
        maintenanceRequestId: id,
        comment,
        status: status || request.status,
        updatedBy: updaterId,
      },
    });

    if (status && status !== request.status) {
      await tx.maintenanceRequest.update({
        where: { id },
        data: { status },
      });
    }

    await activityLogService.log({
      userId: updaterId,
      action: 'UPDATE',
      module: 'MAINTENANCE_UPDATE',
      referenceId: update.id,
    });

    return update;
  });
};

export const resolveRequest = async (id, managerId) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    await tx.asset.update({
      where: { id: request.assetId },
      data: { status: 'AVAILABLE' },
    });

    await tx.maintenanceUpdate.create({
      data: {
        maintenanceRequestId: id,
        comment: 'Maintenance successfully completed and resolved. Asset returned to service.',
        status: 'RESOLVED',
        updatedBy: managerId,
      },
    });

    await activityLogService.log({
      userId: managerId,
      action: 'UPDATE',
      module: 'MAINTENANCE_RESOLVED',
      referenceId: id,
      oldData: request,
      newData: updated,
    });

    await notificationService.createNotification({
      userId: request.requestedBy,
      title: 'Maintenance Resolved',
      message: `The maintenance issue for your requested asset ${request.asset.assetName} has been resolved.`,
      type: 'MAINTENANCE_RESOLVED',
      referenceType: 'MAINTENANCE',
      referenceId: id,
    });

    logger.info(`Maintenance request ${id} resolved and completed.`);
    return updated;
  });
};

export const getMaintenanceById = async (id) => {
  const request = await prisma.maintenanceRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      asset: true,
      requester: { select: { id: true, firstName: true, lastName: true, email: true } },
      approver: { select: { id: true, firstName: true, lastName: true, email: true } },
      technician: { select: { id: true, firstName: true, lastName: true, email: true } },
      updates: {
        include: {
          updater: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!request) {
    throw new ApiError(404, 'Maintenance request not found');
  }
  return request;
};

export const getAllMaintenances = async (params = {}, requester) => {
  const { page, limit, skip } = getPagination(params);
  const { status, priority, assetId } = params;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assetId ? { assetId } : {}),
  };

  if (requester.role.name === 'EMPLOYEE') {
    where.requestedBy = requester.id;
  } else if (requester.role.name === 'DEPARTMENT_HEAD') {
    where.asset = {
      departmentId: requester.departmentId,
    };
  }

  const sort = getSortQuery(params, 'createdAt', 'desc');

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
      orderBy: sort,
    }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  return { data, total };
};

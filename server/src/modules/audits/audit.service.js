import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as activityLogService from '../activity-logs/activity-log.service.js';
import * as notificationService from '../notifications/notification.service.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';
import { generateAuditNumber } from '../../utils/generateAuditNumber.js';
import logger from '../../config/logger.js';

export const createAuditCycle = async (data, creatorId) => {
  const { title, departmentId, location, startDate, endDate } = data;

  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null },
    });
    if (!dept) {
      throw new ApiError(404, 'Department not found');
    }
  }

  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ['RETIRED', 'DISPOSED'] },
      ...(departmentId ? { departmentId } : {}),
    },
  });

  if (assets.length === 0) {
    throw new ApiError(400, 'No assets found matching the audit filter criteria');
  }

  const auditNumber = await generateAuditNumber();

  return await prisma.$transaction(async (tx) => {
    const cycle = await tx.auditCycle.create({
      data: {
        auditNumber,
        title,
        departmentId,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'OPEN',
        createdBy: creatorId,
      },
    });

    const auditItemsData = assets.map((asset) => ({
      auditCycleId: cycle.id,
      assetId: asset.id,
      verificationStatus: null,
    }));

    await tx.auditItem.createMany({
      data: auditItemsData,
    });

    await activityLogService.log({
      userId: creatorId,
      action: 'CREATE',
      module: 'AUDIT_CYCLE',
      referenceId: cycle.id,
      newData: cycle,
    });

    logger.info(`Audit Cycle created: ${auditNumber} - ${title}`, { id: cycle.id });
    return cycle;
  });
};

export const submitVerification = async (cycleId, verificationData, auditorId) => {
  const { assetId, verificationStatus, remarks } = verificationData;

  return await prisma.$transaction(async (tx) => {
    const cycle = await tx.auditCycle.findUnique({
      where: { id: cycleId },
    });
    if (!cycle) {
      throw new ApiError(404, 'Audit cycle not found');
    }
    if (cycle.status === 'CLOSED') {
      throw new ApiError(400, 'Cannot submit verification to a closed audit cycle');
    }

    const auditItem = await tx.auditItem.findFirst({
      where: { auditCycleId: cycleId, assetId },
    });
    if (!auditItem) {
      throw new ApiError(404, 'Asset is not part of this audit cycle');
    }

    const updatedItem = await tx.auditItem.update({
      where: { id: auditItem.id },
      data: {
        auditorId,
        verificationStatus,
        remarks,
      },
      include: { asset: true },
    });

    if (verificationStatus === 'MISSING') {
      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'LOST' },
      });
    } else if (verificationStatus === 'DAMAGED') {
      await tx.asset.update({
        where: { id: assetId },
        data: { condition: 'DAMAGED' },
      });
    }

    if (cycle.status === 'OPEN') {
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    await activityLogService.log({
      userId: auditorId,
      action: 'AUDIT',
      module: 'AUDIT_ITEM',
      referenceId: auditItem.id,
      newData: updatedItem,
    });

    logger.info(`Audit item verified: asset ${assetId} status ${verificationStatus} by ${auditorId}`);
    return updatedItem;
  });
};

export const closeAuditCycle = async (id, userId) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id },
  });
  if (!cycle) {
    throw new ApiError(404, 'Audit cycle not found');
  }
  if (cycle.status === 'CLOSED') {
    throw new ApiError(400, 'Audit cycle is already closed');
  }

  const updated = await prisma.auditCycle.update({
    where: { id },
    data: { status: 'CLOSED' },
  });

  await activityLogService.log({
    userId,
    action: 'UPDATE',
    module: 'AUDIT_CYCLE_CLOSE',
    referenceId: id,
    oldData: cycle,
    newData: updated,
  });

  await notificationService.createNotification({
    userId: cycle.createdBy,
    title: 'Audit Cycle Completed',
    message: `Audit cycle ${cycle.auditNumber} has been officially closed.`,
    type: 'AUDIT_COMPLETED',
    referenceType: 'AUDIT',
    referenceId: id,
  });

  logger.info(`Audit cycle ${cycle.auditNumber} closed by ${userId}`);
  return updated;
};

export const getDiscrepancyReport = async (id) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id },
    include: {
      creator: { select: { firstName: true, lastName: true } },
      department: true,
    },
  });
  if (!cycle) {
    throw new ApiError(404, 'Audit cycle not found');
  }

  const items = await prisma.auditItem.findMany({
    where: { auditCycleId: id },
    include: {
      asset: { include: { category: true, department: true } },
      auditor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  const missing = items.filter((item) => item.verificationStatus === 'MISSING');
  const damaged = items.filter((item) => item.verificationStatus === 'DAMAGED');
  const pending = items.filter((item) => item.verificationStatus === null);
  const verified = items.filter((item) => item.verificationStatus === 'VERIFIED');

  return {
    cycle,
    summary: {
      total: items.length,
      verified: verified.length,
      missing: missing.length,
      damaged: damaged.length,
      pending: pending.length,
      discrepancyCount: missing.length + damaged.length,
    },
    discrepancies: {
      missing,
      damaged,
    },
    pending,
  };
};

export const getAllCycles = async (params = {}) => {
  const { page, limit, skip } = getPagination(params);
  const { departmentId, status } = params;

  const where = {
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
  };

  const sort = getSortQuery(params, 'createdAt', 'desc');

  const [data, total] = await prisma.$transaction([
    prisma.auditCycle.findMany({
      where,
      skip,
      take: limit,
      include: {
        department: true,
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: sort,
    }),
    prisma.auditCycle.count({ where }),
  ]);

  return { data, total };
};

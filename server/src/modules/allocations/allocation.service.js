import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as activityLogService from '../activity-logs/activity-log.service.js';
import * as notificationService from '../notifications/notification.service.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';
import logger from '../../config/logger.js';

export const allocateAsset = async (data, allocatorId) => {
  const { assetId, employeeId, expectedReturnDate } = data;

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
  });
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }
  if (asset.status !== 'AVAILABLE') {
    throw new ApiError(400, `Asset is not available for allocation. Current status: ${asset.status}`);
  }

  const employee = await prisma.user.findFirst({
    where: { id: employeeId, deletedAt: null },
  });
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  return await prisma.$transaction(async (tx) => {
    await tx.asset.update({
      where: { id: assetId },
      data: { status: 'ALLOCATED' },
    });

    const allocation = await tx.assetAllocation.create({
      data: {
        assetId,
        employeeId,
        departmentId: employee.departmentId,
        allocatedBy: allocatorId,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        status: 'ACTIVE',
      },
      include: { asset: true, employee: true },
    });

    await activityLogService.log({
      userId: allocatorId,
      action: 'ALLOCATE',
      module: 'ASSET_ALLOCATION',
      referenceId: allocation.id,
      oldData: asset,
      newData: allocation,
    });

    await notificationService.createNotification({
      userId: employeeId,
      title: 'Asset Allocated',
      message: `You have been allocated the asset: ${asset.assetName} [${asset.assetTag}].`,
      type: 'ASSET_ASSIGNED',
      referenceType: 'ALLOCATION',
      referenceId: allocation.id,
    });

    logger.info(`Asset ${asset.assetTag} allocated to employee ID: ${employeeId}`, { id: allocation.id });
    return allocation;
  });
};

export const returnAsset = async (id, data, returnerId) => {
  const { returnNotes } = data;

  const allocation = await prisma.assetAllocation.findUnique({
    where: { id },
    include: { asset: true, employee: true },
  });
  if (!allocation) {
    throw new ApiError(404, 'Allocation record not found');
  }
  if (allocation.status !== 'ACTIVE') {
    throw new ApiError(400, 'Allocation is already closed/returned');
  }

  return await prisma.$transaction(async (tx) => {
    const closedAllocation = await tx.assetAllocation.update({
      where: { id },
      data: {
        returnedAt: new Date(),
        returnNotes,
        status: 'RETURNED',
      },
    });

    await tx.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE' },
    });

    await activityLogService.log({
      userId: returnerId,
      action: 'RETURN',
      module: 'ASSET_ALLOCATION',
      referenceId: id,
      oldData: allocation,
      newData: closedAllocation,
    });

    await notificationService.createNotification({
      userId: allocation.employeeId,
      title: 'Asset Returned',
      message: `The return of your allocated asset: ${allocation.asset.assetName} has been processed.`,
      type: 'ASSET_RETURNED',
      referenceType: 'ALLOCATION',
      referenceId: id,
    });

    logger.info(`Asset ${allocation.asset.assetTag} returned by employee ID: ${allocation.employeeId}`, { id });
    return closedAllocation;
  });
};

export const getAllocationById = async (id) => {
  const allocation = await prisma.assetAllocation.findUnique({
    where: { id },
    include: {
      asset: { include: { category: true } },
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      department: true,
      approver: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!allocation) {
    throw new ApiError(404, 'Allocation record not found');
  }
  return allocation;
};

export const getAllAllocations = async (params = {}, requester) => {
  const { page, limit, skip } = getPagination(params);
  const { search, assetId, employeeId, departmentId, status } = params;

  const where = {
    ...(status ? { status } : {}),
    ...(assetId ? { assetId } : {}),
    ...(departmentId ? { departmentId } : {}),
  };

  if (requester.role.name === 'EMPLOYEE') {
    where.employeeId = requester.id;
  } else if (requester.role.name === 'DEPARTMENT_HEAD') {
    where.employee = {
      departmentId: requester.departmentId,
    };
  } else if (employeeId) {
    where.employeeId = employeeId;
  }

  if (search) {
    where.OR = [
      {
        asset: {
          OR: [
            { assetName: { contains: search, mode: 'insensitive' } },
            { assetTag: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
      {
        employee: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const sort = getSortQuery(params, 'allocatedAt', 'desc');

  const [data, total] = await prisma.$transaction([
    prisma.assetAllocation.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: true,
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: sort,
    }),
    prisma.assetAllocation.count({ where }),
  ]);

  return { data, total };
};

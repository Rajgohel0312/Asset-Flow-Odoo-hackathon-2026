import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as activityLogService from '../activity-logs/activity-log.service.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';
import logger from '../../config/logger.js';

export const createDepartment = async (data, creatorId) => {
  const { name, description, parentDepartmentId, departmentHeadId } = data;

  if (parentDepartmentId) {
    const parent = await prisma.department.findFirst({
      where: { id: parentDepartmentId, deletedAt: null },
    });
    if (!parent) {
      throw new ApiError(404, 'Parent department not found');
    }
  }

  if (departmentHeadId) {
    const head = await prisma.user.findFirst({
      where: { id: departmentHeadId, deletedAt: null },
    });
    if (!head) {
      throw new ApiError(404, 'Department Head user not found');
    }
  }

  return await prisma.$transaction(async (tx) => {
    const dept = await tx.department.create({
      data: {
        name,
        description,
        parentDepartmentId,
        departmentHeadId,
        status: 'ACTIVE',
      },
    });

    if (departmentHeadId) {
      const headRole = await tx.role.findFirst({
        where: { name: 'DEPARTMENT_HEAD' },
      });
      if (headRole) {
        await tx.user.update({
          where: { id: departmentHeadId },
          data: { roleId: headRole.id, departmentId: dept.id },
        });
      }
    }

    await activityLogService.log({
      userId: creatorId,
      action: 'CREATE',
      module: 'DEPARTMENT',
      referenceId: dept.id,
      newData: dept,
    });

    logger.info(`Department created: ${dept.name}`, { id: dept.id });
    return dept;
  });
};

export const getDepartmentById = async (id) => {
  const dept = await prisma.department.findFirst({
    where: { id, deletedAt: null },
    include: {
      parentDepartment: true,
      departmentHead: { select: { id: true, firstName: true, lastName: true, email: true } },
      childDepartments: { where: { deletedAt: null } },
    },
  });
  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }
  return dept;
};

export const getAllDepartments = async (params = {}) => {
  const { page, limit, skip } = getPagination(params);
  const { search, status } = params;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
  };

  if (search) {
    where.AND = [getSearchQuery(['name', 'description'], search)];
  }

  const sort = getSortQuery(params, 'name', 'asc');

  const [data, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      skip,
      take: limit,
      include: {
        departmentHead: { select: { id: true, firstName: true, lastName: true, email: true } },
        parentDepartment: true,
        _count: { select: { users: true, assets: true } },
      },
      orderBy: sort,
    }),
    prisma.department.count({ where }),
  ]);

  return { data, total };
};

export const updateDepartment = async (id, data, modifierId) => {
  const dept = await prisma.department.findFirst({
    where: { id, deletedAt: null },
  });
  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }

  const { name, description, parentDepartmentId, departmentHeadId } = data;

  if (parentDepartmentId) {
    if (parentDepartmentId === id) {
      throw new ApiError(400, 'A department cannot be its own parent');
    }
    const parent = await prisma.department.findFirst({
      where: { id: parentDepartmentId, deletedAt: null },
    });
    if (!parent) {
      throw new ApiError(404, 'Parent department not found');
    }
  }

  if (departmentHeadId) {
    const head = await prisma.user.findFirst({
      where: { id: departmentHeadId, deletedAt: null },
    });
    if (!head) {
      throw new ApiError(404, 'Department Head user not found');
    }
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.department.update({
      where: { id },
      data: {
        name,
        description,
        parentDepartmentId,
        departmentHeadId,
      },
    });

    if (departmentHeadId && departmentHeadId !== dept.departmentHeadId) {
      const headRole = await tx.role.findFirst({
        where: { name: 'DEPARTMENT_HEAD' },
      });
      if (headRole) {
        await tx.user.update({
          where: { id: departmentHeadId },
          data: { roleId: headRole.id, departmentId: id },
        });
      }
    }

    await activityLogService.log({
      userId: modifierId,
      action: 'UPDATE',
      module: 'DEPARTMENT',
      referenceId: id,
      oldData: dept,
      newData: updated,
    });

    logger.info(`Department updated: ${updated.name}`, { id });
    return updated;
  });
};

export const deleteDepartment = async (id, destroyerId) => {
  const dept = await prisma.department.findFirst({
    where: { id, deletedAt: null },
  });
  if (!dept) {
    throw new ApiError(404, 'Department not found');
  }

  const [activeUsersCount, activeAssetsCount] = await Promise.all([
    prisma.user.count({ where: { departmentId: id, deletedAt: null } }),
    prisma.asset.count({ where: { departmentId: id, deletedAt: null } }),
  ]);

  if (activeUsersCount > 0) {
    throw new ApiError(400, `Cannot delete department. There are ${activeUsersCount} active users assigned to it.`);
  }

  if (activeAssetsCount > 0) {
    throw new ApiError(400, `Cannot delete department. There are ${activeAssetsCount} active assets assigned to it.`);
  }

  const deleted = await prisma.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await activityLogService.log({
    userId: destroyerId,
    action: 'DELETE',
    module: 'DEPARTMENT',
    referenceId: id,
    oldData: dept,
  });

  logger.info(`Department soft deleted: ${dept.name}`, { id });
  return deleted;
};

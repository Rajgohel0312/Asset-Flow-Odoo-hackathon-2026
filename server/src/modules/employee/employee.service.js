import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import * as activityLogService from '../activity-logs/activity-log.service.js';
import { getPagination } from '../../utils/pagination.js';
import { getSearchQuery } from '../../utils/search.js';
import { getSortQuery } from '../../utils/sort.js';
import logger from '../../config/logger.js';

export const getEmployeeById = async (id) => {
  const employee = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { role: true, department: true },
  });
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }
  return employee;
};

export const getAllEmployees = async (params = {}) => {
  const { page, limit, skip } = getPagination(params);
  const { search, roleId, departmentId, status } = params;

  const where = {
    deletedAt: null,
    ...(roleId ? { roleId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const sort = getSortQuery(params, 'firstName', 'asc');

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: { role: true, department: true },
      orderBy: sort,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
};

export const updateEmployee = async (id, data, requester) => {
  const employee = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  if (requester.role.name !== 'ADMIN' && requester.id !== id) {
    throw new ApiError(403, 'Forbidden. You cannot edit another employee profile.');
  }

  const { firstName, lastName, phone, departmentId } = data;

  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null },
    });
    if (!dept) {
      throw new ApiError(404, 'Department not found');
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      firstName,
      lastName,
      phone,
      departmentId,
    },
    include: { role: true, department: true },
  });

  await activityLogService.log({
    userId: requester.id,
    action: 'UPDATE',
    module: 'EMPLOYEE',
    referenceId: id,
    oldData: employee,
    newData: updated,
  });

  logger.info(`Employee profile updated: ${updated.email}`, { id });
  return updated;
};

export const promoteEmployee = async (id, data, requester) => {
  const employee = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { role: true },
  });
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const { roleId } = data;
  const targetRole = await prisma.role.findUnique({
    where: { id: roleId },
  });
  if (!targetRole) {
    throw new ApiError(404, 'Role not found');
  }

  if (targetRole.name === 'ADMIN' && requester.role.name !== 'ADMIN') {
    throw new ApiError(403, 'Forbidden. Only administrators can promote users to ADMIN.');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { roleId },
    include: { role: true, department: true },
  });

  await activityLogService.log({
    userId: requester.id,
    action: 'UPDATE',
    module: 'EMPLOYEE_ROLE',
    referenceId: id,
    oldData: employee,
    newData: updated,
  });

  logger.info(`Employee role updated: ${updated.email} to ${targetRole.name}`, { id });
  return updated;
};

export const updateStatus = async (id, data, requester) => {
  const employee = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { role: true },
  });
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const { status } = data;

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    include: { role: true, department: true },
  });

  await activityLogService.log({
    userId: requester.id,
    action: 'UPDATE',
    module: 'EMPLOYEE_STATUS',
    referenceId: id,
    oldData: employee,
    newData: updated,
  });

  logger.info(`Employee status updated: ${updated.email} to ${status}`, { id });
  return updated;
};

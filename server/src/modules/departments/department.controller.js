import * as departmentService from './department.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const create = asyncHandler(async (req, res, next) => {
  const department = await departmentService.createDepartment(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, department, 'Department created successfully')
  );
});

export const getById = asyncHandler(async (req, res, next) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, department, 'Department details retrieved successfully')
  );
});

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await departmentService.getAllDepartments(req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Departments list retrieved successfully', meta)
  );
});

export const update = asyncHandler(async (req, res, next) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, department, 'Department updated successfully')
  );
});

export const remove = asyncHandler(async (req, res, next) => {
  await departmentService.deleteDepartment(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, null, 'Department deleted successfully')
  );
});

import * as maintenanceService from './maintenance.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const create = asyncHandler(async (req, res, next) => {
  const request = await maintenanceService.requestMaintenance(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, request, 'Maintenance request submitted successfully')
  );
});

export const getById = asyncHandler(async (req, res, next) => {
  const request = await maintenanceService.getMaintenanceById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, request, 'Maintenance request details retrieved successfully')
  );
});

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await maintenanceService.getAllMaintenances(req.query, req.user);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Maintenance requests list retrieved successfully', meta)
  );
});

export const approve = asyncHandler(async (req, res, next) => {
  const request = await maintenanceService.approveRequest(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, request, 'Maintenance request approved successfully')
  );
});

export const reject = asyncHandler(async (req, res, next) => {
  const request = await maintenanceService.rejectRequest(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, request, 'Maintenance request rejected successfully')
  );
});

export const assignTechnician = asyncHandler(async (req, res, next) => {
  const request = await maintenanceService.assignTechnician(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, request, 'Technician assigned successfully')
  );
});

export const addUpdate = asyncHandler(async (req, res, next) => {
  const update = await maintenanceService.addRequestUpdate(req.params.id, req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, update, 'Maintenance request status timeline updated successfully')
  );
});

export const resolve = asyncHandler(async (req, res, next) => {
  const request = await maintenanceService.resolveRequest(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, request, 'Maintenance request resolved successfully')
  );
});

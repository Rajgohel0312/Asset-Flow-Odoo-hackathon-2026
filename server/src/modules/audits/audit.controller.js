import * as auditService from './audit.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const create = asyncHandler(async (req, res, next) => {
  const cycle = await auditService.createAuditCycle(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, cycle, 'Audit cycle created successfully')
  );
});

export const getById = asyncHandler(async (req, res, next) => {
  const data = await auditService.getDiscrepancyReport(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, data, 'Audit cycle details retrieved successfully')
  );
});

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await auditService.getAllCycles(req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Audit cycles list retrieved successfully', meta)
  );
});

export const verifyItem = asyncHandler(async (req, res, next) => {
  const item = await auditService.submitVerification(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, item, 'Audit item verified successfully')
  );
});

export const closeCycle = asyncHandler(async (req, res, next) => {
  const cycle = await auditService.closeAuditCycle(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, cycle, 'Audit cycle closed successfully')
  );
});

export const getReport = asyncHandler(async (req, res, next) => {
  const report = await auditService.getDiscrepancyReport(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, report, 'Discrepancy report retrieved successfully')
  );
});

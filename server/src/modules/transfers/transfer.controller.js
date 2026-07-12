import * as transferService from './transfer.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const create = asyncHandler(async (req, res, next) => {
  const transfer = await transferService.requestTransfer(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, transfer, 'Transfer request submitted successfully')
  );
});

export const getById = asyncHandler(async (req, res, next) => {
  const transfer = await transferService.getTransferById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, transfer, 'Transfer request details retrieved successfully')
  );
});

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await transferService.getAllTransfers(req.query, req.user);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Transfer requests retrieved successfully', meta)
  );
});

export const approve = asyncHandler(async (req, res, next) => {
  const transfer = await transferService.approveTransfer(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, transfer, 'Transfer request approved successfully')
  );
});

export const reject = asyncHandler(async (req, res, next) => {
  const transfer = await transferService.rejectTransfer(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, transfer, 'Transfer request rejected successfully')
  );
});

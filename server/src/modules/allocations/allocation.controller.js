import * as allocationService from './allocation.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const create = asyncHandler(async (req, res, next) => {
  const allocation = await allocationService.allocateAsset(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, allocation, 'Asset allocated successfully')
  );
});

export const returnAsset = asyncHandler(async (req, res, next) => {
  const allocation = await allocationService.returnAsset(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, allocation, 'Asset return processed successfully')
  );
});

export const getById = asyncHandler(async (req, res, next) => {
  const allocation = await allocationService.getAllocationById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, allocation, 'Allocation details retrieved successfully')
  );
});

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await allocationService.getAllAllocations(req.query, req.user);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Allocations list retrieved successfully', meta)
  );
});

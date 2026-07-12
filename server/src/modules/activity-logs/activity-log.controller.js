import * as activityLogService from './activity-log.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await activityLogService.findAll(req.query, req.user);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Activity logs list retrieved successfully', meta)
  );
});

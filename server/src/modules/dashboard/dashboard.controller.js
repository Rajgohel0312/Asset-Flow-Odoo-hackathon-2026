import * as dashboardService from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const getDashboard = asyncHandler(async (req, res, next) => {
  const data = await dashboardService.getDashboardData(req.user);
  return res.status(200).json(
    new ApiResponse(200, data, 'Dashboard analytics data retrieved successfully')
  );
});

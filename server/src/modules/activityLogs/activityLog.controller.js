import * as activityLogService from './activityLog.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const action = req.query.action;
    const module = req.query.module;
    const userId = req.query.userId;
    const search = req.query.search;

    const result = await activityLogService.getActivityLogs(
      { page, limit, action, module, userId, search },
      req.user
    );

    const meta = {
      page,
      limit,
      total: result.total,
      pages: Math.ceil(result.total / limit),
    };

    return sendSuccess(res, result.data, 'Activity logs list retrieved successfully', 200, meta);
  } catch (err) {
    next(err);
  }
};

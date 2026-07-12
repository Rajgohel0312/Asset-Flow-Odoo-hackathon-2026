import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { toUserDTO } from '../../mappers/user.mapper.js';
import logger from '../../config/logger.js';

export const register = asyncHandler(async (req, res, next) => {
  const user = await authService.registerUser(req.body);
  logger.info(`User registered successfully: ${user.email}`);
  return res.status(201).json(
    new ApiResponse(201, toUserDTO(user), 'Employee registered successfully')
  );
});

export const login = asyncHandler(async (req, res, next) => {
  const result = await authService.loginUser(req.body);
  logger.info(`User logged in successfully: ${result.user.email}`);
  return res.status(200).json(
    new ApiResponse(200, {
      token: result.token,
      user: toUserDTO(result.user),
    }, 'Login successful')
  );
});

export const me = asyncHandler(async (req, res, next) => {
  const user = await authService.getUserProfile(req.user.id);
  return res.status(200).json(
    new ApiResponse(200, toUserDTO(user), 'User profile retrieved successfully')
  );
});

export const changePassword = asyncHandler(async (req, res, next) => {
  await authService.updatePassword(req.user.id, req.body);
  logger.info(`Password changed for user ID: ${req.user.id}`);
  return res.status(200).json(
    new ApiResponse(200, null, 'Password updated successfully')
  );
});

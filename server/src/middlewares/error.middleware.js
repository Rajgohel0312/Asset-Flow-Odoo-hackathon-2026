import { sendError } from '../utils/response.js';
import { CustomError } from '../utils/errors.js';
import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';
import pkg from '@prisma/client';
import logger from '../config/logger.js';
const { Prisma } = pkg;

export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (process.env.NODE_ENV !== 'production') {
    logger.error(`Error details: ${message}`, err.stack);
  }

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      const targets = err.meta?.target || [];
      message = `Conflict: Unique constraint failed on field(s) (${targets.join(', ')})`;
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = `Foreign key validation failed: ${err.meta?.field_name || 'invalid reference'}`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = err.meta?.cause || 'Resource not found';
    }
  } else if (err instanceof CustomError || err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  return sendError(res, message, errors, statusCode);
};

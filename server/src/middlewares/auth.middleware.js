import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Token is expired or invalid');
    }

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Your account has been deactivated or suspended');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRole = req.user.role.name;
    if (!allowedRoles.includes(userRole)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication is required');

  let payload;
  try {
    payload = jwt.verify(token, req.app.locals.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Authentication is required');
  }
  const user = await User.findById(payload.sub).select('-passwordHash -passwordResetTokenHash -emailVerificationTokenHash');
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw new ApiError(401, 'Authentication is required');
  }
  req.user = user;
  next();
});

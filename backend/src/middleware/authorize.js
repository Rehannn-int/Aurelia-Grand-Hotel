import ApiError from '../utils/ApiError.js';

export function requireRole(...roles) {
  return function authorizeRequest(req, res, next) {
    if (!req.user) return next(new ApiError(401, 'Authentication is required'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You are not permitted to perform this action'));
    return next();
  };
}

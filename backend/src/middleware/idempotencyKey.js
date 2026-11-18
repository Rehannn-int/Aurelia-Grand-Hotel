import ApiError from '../utils/ApiError.js';

export function requireIdempotencyKey(req, res, next) {
  const value = req.get('idempotency-key');
  if (!value || value.length < 8 || value.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(value)) {
    return next(new ApiError(400, 'A valid Idempotency-Key header is required'));
  }
  req.idempotencyKey = value;
  return next();
}

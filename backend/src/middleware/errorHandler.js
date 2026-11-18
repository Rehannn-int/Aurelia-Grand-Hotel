import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found`));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let statusCode = error.statusCode || 500;
  let message = error.message || 'The request could not be completed';
  let errors = error.errors || [];

  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Request validation failed';
    errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid identifier';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with these details already exists';
  }

  if (statusCode >= 500) {
    console.error('Unhandled request error', { name: error.name, statusCode });
    message = 'The request could not be completed';
  }

  return res.status(statusCode).json({ success: false, message, errors });
}

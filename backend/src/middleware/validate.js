import ApiError from '../utils/ApiError.js';

export function validate(schema, source = 'body') {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new ApiError(400, 'Request validation failed', result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))));
      return;
    }
    if (source === 'query') req.validatedQuery = result.data;
    else req[source] = result.data;
    next();
  };
}

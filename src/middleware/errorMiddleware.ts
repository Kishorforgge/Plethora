import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle routes that are not found (404).
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global centralized error handler middleware.
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Format specific Mongoose database validation errors, duplicate keys, etc.
  let message = err.message;
  let errors: string[] = [];

  // Mongoose Cast Error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400);
    message = 'Resource not found or invalid format.';
  }

  // Mongoose Duplicate Key Error
  if ((err as any).code === 11000) {
    res.status(400);
    const field = Object.keys((err as any).keyValue)[0];
    message = `User already exists with this ${field}.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    res.status(400);
    const valErrors = Object.values((err as any).errors).map((e: any) => e.message);
    message = 'Validation error';
    errors = valErrors;
  }

  res.status(res.statusCode).json({
    status: 'fail',
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

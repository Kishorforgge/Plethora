"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
/**
 * Middleware to handle routes that are not found (404).
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
exports.notFound = notFound;
/**
 * Global centralized error handler middleware.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    // Format specific Mongoose database validation errors, duplicate keys, etc.
    let message = err.message;
    let errors = [];
    // Mongoose Cast Error (e.g., invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400);
        message = 'Resource not found or invalid format.';
    }
    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        res.status(400);
        const field = Object.keys(err.keyValue)[0];
        message = `User already exists with this ${field}.`;
    }
    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        res.status(400);
        const valErrors = Object.values(err.errors).map((e) => e.message);
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
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorMiddleware.js.map
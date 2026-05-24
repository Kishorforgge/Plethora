import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to handle routes that are not found (404).
 */
export declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Global centralized error handler middleware.
 */
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;

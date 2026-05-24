import { Request, Response, NextFunction } from 'express';
/**
 * Validator middleware for user registration.
 */
export declare const validateRegister: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validator middleware for user login.
 */
export declare const validateLogin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validator middleware for comments.
 */
export declare const validateComment: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validator middleware for profiles.
 */
export declare const validateProfileUpdate: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;

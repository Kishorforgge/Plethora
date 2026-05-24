import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export declare const registerUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export declare const loginUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Logout user (stateless JWT, send success response)
 * @route   POST /api/auth/logout
 * @access  Public
 */
export declare const logoutUser: (req: Request, res: Response) => Promise<void>;
/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export declare const getMe: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

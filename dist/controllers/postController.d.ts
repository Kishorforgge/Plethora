import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
/**
 * @desc    Upload an image post
 * @route   POST /api/posts/upload
 * @access  Private
 */
export declare const createPost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Fetch all posts with pagination, search, and tag filters
 * @route   GET /api/posts
 * @access  Public (Optional Authentication to populate user-specific like/bookmark states)
 */
export declare const getPosts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Fetch a single post by ID
 * @route   GET /api/posts/:id
 * @access  Public (Optional Authentication)
 */
export declare const getPostById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Delete post (owner only)
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
export declare const deletePost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Like a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
export declare const likePost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * @desc    Unlike a post
 * @route   POST /api/posts/:id/unlike
 * @access  Private
 */
export declare const unlikePost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * @desc    Bookmark a post
 * @route   POST /api/posts/:id/bookmark
 * @access  Private
 */
export declare const bookmarkPost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * @desc    Unbookmark a post
 * @route   POST /api/posts/:id/unbookmark
 * @access  Private
 */
export declare const unbookmarkPost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;

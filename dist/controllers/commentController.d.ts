import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
/**
 * @desc    Add a comment to a post
 * @route   POST /api/comments/:postId
 * @access  Private
 */
export declare const addComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Get comments for a post (paginated)
 * @route   GET /api/comments/:postId
 * @access  Public
 */
export declare const getCommentsByPost: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private
 */
export declare const deleteComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:commentId
 * @access  Private (comment owner only)
 */
export declare const updateComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

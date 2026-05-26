import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
/**
 * @desc    List conversations for the current user
 * @route   GET /api/discussions
 * @access  Private
 */
export declare const getMyConversations: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Create a conversation with one or more users
 * @route   POST /api/discussions
 * @access  Private
 */
export declare const createConversation: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Get messages in a conversation
 * @route   GET /api/discussions/:id/messages
 * @access  Private
 */
export declare const getConversationMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Send a message in a conversation
 * @route   POST /api/discussions/:id/messages
 * @access  Private
 */
export declare const sendMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

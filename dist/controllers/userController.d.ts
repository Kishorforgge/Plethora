import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
/**
 * @desc    Edit user profile (fullName, bio)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export declare const updateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Upload/Update profile picture
 * @route   PUT /api/users/profile-picture
 * @access  Private
 */
export declare const updateProfilePicture: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Follow a user
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
export declare const followUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * @desc    Unfollow a user
 * @route   POST /api/users/:id/unfollow
 * @access  Private
 */
export declare const unfollowUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * @desc    Suggested creators to follow (sorted by popularity)
 * @route   GET /api/users/suggested
 * @access  Private
 */
export declare const getSuggestedCreators: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Get current user's followers list
 * @route   GET /api/users/me/followers
 * @access  Private
 */
export declare const getMyFollowers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Get current user's following list
 * @route   GET /api/users/me/following
 * @access  Private
 */
export declare const getMyFollowing: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Search users by username or fullName
 * @route   GET /api/users/search
 * @access  Public (or Private, typically accessible)
 */
export declare const searchUsers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
export declare const getUserProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

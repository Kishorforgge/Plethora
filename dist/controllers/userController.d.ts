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
/**
 * @desc    Get followers of any user (by userId)
 * @route   GET /api/users/:userId/followers
 * @access  Private
 */
export declare const getUserFollowers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Get following of any user (by userId)
 * @route   GET /api/users/:userId/following
 * @access  Private
 */
export declare const getUserFollowing: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Search followers and following by query
 * @route   GET /api/users/search-followers
 * @access  Private
 */
export declare const searchFollowersAndFollowing: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * @desc    Remove a follower (make them unfollow you)
 * @route   POST /api/users/:id/remove-follower
 * @access  Private
 */
export declare const removeFollower: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Block a user
 * @route   POST /api/users/:id/block
 * @access  Private
 */
export declare const blockUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Unblock a user
 * @route   POST /api/users/:id/unblock
 * @access  Private
 */
export declare const unblockUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Mute a user
 * @route   POST /api/users/:id/mute
 * @access  Private
 */
export declare const muteUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Unmute a user
 * @route   POST /api/users/:id/unmute
 * @access  Private
 */
export declare const unmuteUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Get user profile by username including postsCount
 * @route   GET /api/users/profile/:username
 * @access  Public (Optional auth)
 */
export declare const getUserProfileByUsername: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfileByUsername = exports.unmuteUser = exports.muteUser = exports.unblockUser = exports.blockUser = exports.removeFollower = exports.searchFollowersAndFollowing = exports.getUserFollowing = exports.getUserFollowers = exports.getUserProfile = exports.searchUsers = exports.getMyFollowing = exports.getMyFollowers = exports.getSuggestedCreators = exports.unfollowUser = exports.followUser = exports.updateProfilePicture = exports.updateProfile = void 0;
const User_1 = require("../models/User");
const Post_1 = require("../models/Post");
const Notification_1 = require("../models/Notification");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const socket_1 = require("../socket");
/**
 * @desc    Edit user profile (fullName, bio)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
    const { fullName, bio } = req.body;
    try {
        const user = await User_1.User.findById(req.user?._id);
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (fullName !== undefined)
            user.fullName = fullName;
        if (bio !== undefined)
            user.bio = bio;
        await user.save();
        res.status(200).json({
            status: 'success',
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followersCount: user.followers.length,
                followingCount: user.following.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
/**
 * @desc    Upload/Update profile picture
 * @route   PUT /api/users/profile-picture
 * @access  Private
 */
const updateProfilePicture = async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.user?._id);
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (!req.file) {
            res.status(400);
            return next(new Error('Please provide an image file to upload.'));
        }
        // Upload new image to Cloudinary
        const uploadResult = await (0, uploadMiddleware_1.uploadToCloudinary)(req.file.buffer, 'plethora/avatars');
        // Delete old profile picture from Cloudinary if it exists and is not the default
        if (user.cloudinaryId) {
            await (0, uploadMiddleware_1.deleteFromCloudinary)(user.cloudinaryId).catch((err) => console.error('Failed to delete old avatar from Cloudinary:', err));
        }
        // Update user record
        user.profilePicture = uploadResult.secure_url;
        user.cloudinaryId = uploadResult.public_id;
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'Profile picture updated successfully.',
            data: {
                profilePicture: user.profilePicture,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfilePicture = updateProfilePicture;
/**
 * @desc    Follow a user
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
const followUser = async (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user?._id;
    try {
        if (targetId === currentUserId?.toString()) {
            res.status(400);
            return next(new Error('You cannot follow yourself.'));
        }
        const targetUser = await User_1.User.findById(targetId);
        const currentUser = await User_1.User.findById(currentUserId);
        if (!targetUser || !currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        // Check if already following
        if (currentUser.following.includes(targetUser._id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'You are already following this user.',
            });
        }
        // Update follow arrays
        currentUser.following.push(targetUser._id);
        targetUser.followers.push(currentUser._id);
        await currentUser.save();
        await targetUser.save();
        // Create a follow notification
        await Notification_1.Notification.create({
            sender: currentUser._id,
            receiver: targetUser._id,
            type: 'follow',
        });
        // Broadcast follow update in real-time
        (0, socket_1.broadcastEvent)('follow_update', {
            followerId: currentUser._id.toString(),
            followingId: targetUser._id.toString(),
            action: 'follow',
        });
        res.status(200).json({
            status: 'success',
            message: `You are now following ${targetUser.username}.`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.followUser = followUser;
/**
 * @desc    Unfollow a user
 * @route   POST /api/users/:id/unfollow
 * @access  Private
 */
const unfollowUser = async (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user?._id;
    try {
        const targetUser = await User_1.User.findById(targetId);
        const currentUser = await User_1.User.findById(currentUserId);
        if (!targetUser || !currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        // Check if not following
        if (!currentUser.following.includes(targetUser._id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'You are not following this user.',
            });
        }
        // Remove from arrays
        currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUser._id.toString());
        targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUser._id.toString());
        await currentUser.save();
        await targetUser.save();
        // Optional: Delete follow notifications sender->receiver
        await Notification_1.Notification.deleteMany({
            sender: currentUser._id,
            receiver: targetUser._id,
            type: 'follow',
        });
        // Broadcast unfollow update in real-time
        (0, socket_1.broadcastEvent)('follow_update', {
            followerId: currentUser._id.toString(),
            followingId: targetUser._id.toString(),
            action: 'unfollow',
        });
        res.status(200).json({
            status: 'success',
            message: `You have unfollowed ${targetUser.username}.`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unfollowUser = unfollowUser;
/**
 * @desc    Suggested creators to follow (sorted by popularity)
 * @route   GET /api/users/suggested
 * @access  Private
 */
const getSuggestedCreators = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        const users = await User_1.User.find({
            _id: { $ne: req.user._id },
            username: { $not: /^(fallback|test|demo|seed|placeholder)/i }
        })
            .select('username fullName profilePicture bio followers following')
            .limit(40);
        const sorted = users
            .sort((a, b) => b.followers.length - a.followers.length)
            .slice(0, 12)
            .map((u) => ({
            _id: u._id,
            username: u.username,
            fullName: u.fullName,
            bio: u.bio,
            profilePicture: u.profilePicture,
            followersCount: u.followers.length,
            followingCount: u.following.length,
            isFollowing: req.user.following.some((id) => id.toString() === u._id.toString()),
        }));
        res.status(200).json({
            status: 'success',
            results: sorted.length,
            data: sorted,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSuggestedCreators = getSuggestedCreators;
/**
 * @desc    Get current user's followers list
 * @route   GET /api/users/me/followers
 * @access  Private
 */
const getMyFollowers = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        const user = await User_1.User.findById(req.user._id).populate('followers', 'username fullName profilePicture');
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const followers = user.followers.map((f) => ({
            _id: f._id,
            username: f.username,
            fullName: f.fullName,
            profilePicture: f.profilePicture,
        }));
        res.status(200).json({
            status: 'success',
            results: followers.length,
            data: followers,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyFollowers = getMyFollowers;
/**
 * @desc    Get current user's following list
 * @route   GET /api/users/me/following
 * @access  Private
 */
const getMyFollowing = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        const user = await User_1.User.findById(req.user._id).populate('following', 'username fullName profilePicture');
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const following = user.following.map((f) => ({
            _id: f._id,
            username: f.username,
            fullName: f.fullName,
            profilePicture: f.profilePicture,
        }));
        res.status(200).json({
            status: 'success',
            results: following.length,
            data: following,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyFollowing = getMyFollowing;
/**
 * @desc    Search users by username or fullName
 * @route   GET /api/users/search
 * @access  Public (or Private, typically accessible)
 */
const searchUsers = async (req, res, next) => {
    const query = req.query.q;
    try {
        if (!query) {
            return res.status(200).json({ status: 'success', data: [] });
        }
        // Regex match username or fullName, excluding dummy accounts
        const users = await User_1.User.find({
            username: { $not: /^(fallback|test|demo|seed|placeholder)/i },
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } },
            ],
        })
            .select('username fullName profilePicture followers following')
            .limit(20);
        console.log("Search query:", req.query.q);
        console.log("Users found:", users.length);
        const formattedUsers = users.map((u) => ({
            _id: u._id,
            username: u.username,
            fullName: u.fullName,
            profilePicture: u.profilePicture,
            followersCount: u.followers.length,
            followingCount: u.following.length,
            isFollowing: req.user
                ? req.user.following.some((id) => id.toString() === u._id.toString())
                : false,
        }));
        res.status(200).json({
            status: 'success',
            results: formattedUsers.length,
            data: formattedUsers,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchUsers = searchUsers;
/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
const getUserProfile = async (req, res, next) => {
    const { username } = req.params;
    try {
        if (/^(fallback|test|demo|seed|placeholder)/i.test(username)) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const user = await User_1.User.findOne({ username: username.toLowerCase() });
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        // Determine if the current authenticated user (if any) is following this profile
        let isFollowing = false;
        if (req.user) {
            isFollowing = user.followers.some((f) => f.toString() === req.user?._id.toString());
        }
        res.status(200).json({
            status: 'success',
            data: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followersCount: user.followers.length,
                followingCount: user.following.length,
                isFollowing,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserProfile = getUserProfile;
/**
 * @desc    Get followers of any user (by userId)
 * @route   GET /api/users/:userId/followers
 * @access  Private
 */
const getUserFollowers = async (req, res, next) => {
    const { userId } = req.params;
    try {
        const user = await User_1.User.findById(userId).populate('followers', 'username fullName profilePicture isVerified');
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const currentUser = req.user ? await User_1.User.findById(req.user._id) : null;
        const blockedIds = currentUser?.blockedUsers?.map((id) => id.toString()) || [];
        const mutedIds = currentUser?.mutedUsers?.map((id) => id.toString()) || [];
        const followers = user.followers.map((f) => ({
            _id: f._id,
            username: f.username,
            fullName: f.fullName,
            profilePicture: f.profilePicture,
            isVerified: f.isVerified || false,
            isFollowing: req.user ? req.user.following.some((id) => id.toString() === f._id.toString()) : false,
            isBlocked: blockedIds.includes(f._id.toString()),
            isMuted: mutedIds.includes(f._id.toString()),
        }));
        res.status(200).json({ status: 'success', data: followers });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserFollowers = getUserFollowers;
/**
 * @desc    Get following of any user (by userId)
 * @route   GET /api/users/:userId/following
 * @access  Private
 */
const getUserFollowing = async (req, res, next) => {
    const { userId } = req.params;
    try {
        const user = await User_1.User.findById(userId).populate('following', 'username fullName profilePicture isVerified');
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const currentUser = req.user ? await User_1.User.findById(req.user._id) : null;
        const blockedIds = currentUser?.blockedUsers?.map((id) => id.toString()) || [];
        const mutedIds = currentUser?.mutedUsers?.map((id) => id.toString()) || [];
        const following = user.following.map((f) => ({
            _id: f._id,
            username: f.username,
            fullName: f.fullName,
            profilePicture: f.profilePicture,
            isVerified: f.isVerified || false,
            isFollowing: req.user ? req.user.following.some((id) => id.toString() === f._id.toString()) : false,
            isBlocked: blockedIds.includes(f._id.toString()),
            isMuted: mutedIds.includes(f._id.toString()),
        }));
        res.status(200).json({ status: 'success', data: following });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserFollowing = getUserFollowing;
/**
 * @desc    Search followers and following by query
 * @route   GET /api/users/search-followers
 * @access  Private
 */
const searchFollowersAndFollowing = async (req, res, next) => {
    const query = req.query.q;
    const currentUserId = req.user?._id;
    try {
        if (!currentUserId) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        if (!query) {
            return res.status(200).json({ status: 'success', data: [] });
        }
        const currentUser = await User_1.User.findById(currentUserId);
        if (!currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const connectionIds = Array.from(new Set([
            ...currentUser.followers.map(id => id.toString()),
            ...currentUser.following.map(id => id.toString())
        ]));
        const users = await User_1.User.find({
            _id: { $in: connectionIds },
            username: { $not: /^(fallback|test|demo|seed|placeholder)/i },
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } }
            ]
        }).select('username fullName profilePicture isVerified followers following');
        const blockedIds = currentUser.blockedUsers?.map((id) => id.toString()) || [];
        const mutedIds = currentUser.mutedUsers?.map((id) => id.toString()) || [];
        const formatted = users.map((u) => ({
            _id: u._id,
            username: u.username,
            fullName: u.fullName,
            profilePicture: u.profilePicture,
            isVerified: u.isVerified || false,
            isFollowing: currentUser.following.some((id) => id.toString() === u._id.toString()),
            isBlocked: blockedIds.includes(u._id.toString()),
            isMuted: mutedIds.includes(u._id.toString()),
        }));
        res.status(200).json({ status: 'success', data: formatted });
    }
    catch (error) {
        next(error);
    }
};
exports.searchFollowersAndFollowing = searchFollowersAndFollowing;
/**
 * @desc    Remove a follower (make them unfollow you)
 * @route   POST /api/users/:id/remove-follower
 * @access  Private
 */
const removeFollower = async (req, res, next) => {
    const targetId = req.params.id; // The follower to remove
    const currentUserId = req.user?._id;
    try {
        const followerUser = await User_1.User.findById(targetId);
        const currentUser = await User_1.User.findById(currentUserId);
        if (!followerUser || !currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        // Check if they are actually a follower
        if (!currentUser.followers.includes(followerUser._id)) {
            res.status(400);
            return next(new Error('This user is not following you.'));
        }
        // Remove follower from current user's followers array
        currentUser.followers = currentUser.followers.filter((id) => id.toString() !== followerUser._id.toString());
        // Remove current user from follower's following array
        followerUser.following = followerUser.following.filter((id) => id.toString() !== currentUser._id.toString());
        await currentUser.save();
        await followerUser.save();
        // Broadcast unfollow/follow update in real-time
        (0, socket_1.broadcastEvent)('follow_update', {
            followerId: followerUser._id.toString(),
            followingId: currentUser._id.toString(),
            action: 'unfollow',
        });
        res.status(200).json({
            status: 'success',
            message: `Removed ${followerUser.username} from your followers.`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeFollower = removeFollower;
/**
 * @desc    Block a user
 * @route   POST /api/users/:id/block
 * @access  Private
 */
const blockUser = async (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user?._id;
    try {
        if (targetId === currentUserId?.toString()) {
            res.status(400);
            return next(new Error('You cannot block yourself.'));
        }
        const currentUser = await User_1.User.findById(currentUserId);
        if (!currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (!currentUser.blockedUsers) {
            currentUser.blockedUsers = [];
        }
        if (!currentUser.blockedUsers.includes(targetId)) {
            currentUser.blockedUsers.push(targetId);
            await currentUser.save();
        }
        res.status(200).json({
            success: true,
            isBlocked: true,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.blockUser = blockUser;
/**
 * @desc    Unblock a user
 * @route   POST /api/users/:id/unblock
 * @access  Private
 */
const unblockUser = async (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user?._id;
    try {
        const currentUser = await User_1.User.findById(currentUserId);
        if (!currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (currentUser.blockedUsers) {
            currentUser.blockedUsers = currentUser.blockedUsers.filter((id) => id.toString() !== targetId);
            await currentUser.save();
        }
        res.status(200).json({
            success: true,
            isBlocked: false,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unblockUser = unblockUser;
/**
 * @desc    Mute a user
 * @route   POST /api/users/:id/mute
 * @access  Private
 */
const muteUser = async (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user?._id;
    try {
        if (targetId === currentUserId?.toString()) {
            res.status(400);
            return next(new Error('You cannot mute yourself.'));
        }
        const currentUser = await User_1.User.findById(currentUserId);
        if (!currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (!currentUser.mutedUsers) {
            currentUser.mutedUsers = [];
        }
        if (!currentUser.mutedUsers.includes(targetId)) {
            currentUser.mutedUsers.push(targetId);
            await currentUser.save();
        }
        res.status(200).json({
            success: true,
            isMuted: true,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.muteUser = muteUser;
/**
 * @desc    Unmute a user
 * @route   POST /api/users/:id/unmute
 * @access  Private
 */
const unmuteUser = async (req, res, next) => {
    const targetId = req.params.id;
    const currentUserId = req.user?._id;
    try {
        const currentUser = await User_1.User.findById(currentUserId);
        if (!currentUser) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (currentUser.mutedUsers) {
            currentUser.mutedUsers = currentUser.mutedUsers.filter((id) => id.toString() !== targetId);
            await currentUser.save();
        }
        res.status(200).json({
            success: true,
            isMuted: false,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unmuteUser = unmuteUser;
/**
 * @desc    Get user profile by username including postsCount
 * @route   GET /api/users/profile/:username
 * @access  Public (Optional auth)
 */
const getUserProfileByUsername = async (req, res, next) => {
    const { username } = req.params;
    try {
        if (/^(fallback|test|demo|seed|placeholder)/i.test(username)) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const user = await User_1.User.findOne({ username: username.toLowerCase() });
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        const postsCount = await Post_1.Post.countDocuments({ user: user._id });
        // Determine if the current authenticated user (if any) is following this profile
        let isFollowing = false;
        if (req.user) {
            isFollowing = user.followers.some((f) => f.toString() === req.user?._id.toString());
        }
        res.status(200).json({
            status: 'success',
            data: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followersCount: user.followers.length,
                followingCount: user.following.length,
                postsCount,
                isFollowing,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserProfileByUsername = getUserProfileByUsername;
//# sourceMappingURL=userController.js.map
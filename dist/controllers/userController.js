"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.searchUsers = exports.getMyFollowing = exports.getMyFollowers = exports.getSuggestedCreators = exports.unfollowUser = exports.followUser = exports.updateProfilePicture = exports.updateProfile = void 0;
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
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
        const users = await User_1.User.find({ _id: { $ne: req.user._id } })
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
        // Regex match username or fullName
        const users = await User_1.User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } },
            ],
        })
            .select('username fullName profilePicture followers following')
            .limit(20);
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
//# sourceMappingURL=userController.js.map
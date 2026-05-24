"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbookmarkPost = exports.bookmarkPost = exports.unlikePost = exports.likePost = exports.deletePost = exports.getPostById = exports.getPosts = exports.createPost = void 0;
const Post_1 = require("../models/Post");
const User_1 = require("../models/User");
const Comment_1 = require("../models/Comment");
const Notification_1 = require("../models/Notification");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
/**
 * @desc    Upload an image post
 * @route   POST /api/posts/upload
 * @access  Private
 */
const createPost = async (req, res, next) => {
    const { caption, tags } = req.body;
    try {
        if (!req.file) {
            res.status(400);
            return next(new Error('Please provide an image file to upload.'));
        }
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        // Upload to Cloudinary
        const uploadResult = await (0, uploadMiddleware_1.uploadToCloudinary)(req.file.buffer, 'plethora/posts');
        // Parse tags (supporting comma-separated string or array)
        let tagList = [];
        if (tags) {
            if (typeof tags === 'string') {
                tagList = tags
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter((t) => t !== '');
            }
            else if (Array.isArray(tags)) {
                tagList = tags
                    .map((t) => t.trim().toLowerCase())
                    .filter((t) => t !== '');
            }
        }
        const post = await Post_1.Post.create({
            user: req.user._id,
            imageUrl: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            caption: caption || '',
            tags: tagList,
        });
        res.status(201).json({
            status: 'success',
            data: post,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createPost = createPost;
/**
 * @desc    Fetch all posts with pagination, search, and tag filters
 * @route   GET /api/posts
 * @access  Public (Optional Authentication to populate user-specific like/bookmark states)
 */
const getPosts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.q;
        const tagQuery = req.query.tag;
        // Build filter object
        const filter = {};
        // Search filter (text search or regex in caption/tags)
        if (searchQuery) {
            filter.$or = [
                { caption: { $regex: searchQuery, $options: 'i' } },
                { tags: { $regex: searchQuery, $options: 'i' } },
            ];
        }
        // Direct tag filter
        if (tagQuery) {
            filter.tags = tagQuery.toLowerCase().trim();
        }
        // Get total posts count for metadata
        const totalPosts = await Post_1.Post.countDocuments(filter);
        // Fetch posts
        const posts = await Post_1.Post.find(filter)
            .populate('user', 'username fullName profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // If user is logged in, attach liked and bookmarked statuses
        const formattedPosts = posts.map((post) => {
            const isLiked = req.user
                ? post.likes.some((id) => id.toString() === req.user?._id.toString())
                : false;
            const isBookmarked = req.user
                ? req.user.bookmarks.some((id) => id.toString() === post._id.toString())
                : false;
            return {
                ...post.toObject(),
                isLiked,
                isBookmarked,
                likesCount: post.likes.length,
            };
        });
        const totalPages = Math.ceil(totalPosts / limit);
        const hasMore = page < totalPages;
        res.status(200).json({
            status: 'success',
            results: formattedPosts.length,
            pagination: {
                page,
                limit,
                totalPages,
                totalPosts,
                hasMore,
            },
            data: formattedPosts,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPosts = getPosts;
/**
 * @desc    Fetch a single post by ID
 * @route   GET /api/posts/:id
 * @access  Public (Optional Authentication)
 */
const getPostById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const post = await Post_1.Post.findById(id).populate('user', 'username fullName profilePicture');
        if (!post) {
            res.status(404);
            return next(new Error('Post not found.'));
        }
        // Determine like/bookmark states
        const isLiked = req.user
            ? post.likes.some((userId) => userId.toString() === req.user?._id.toString())
            : false;
        const isBookmarked = req.user
            ? req.user.bookmarks.some((postId) => postId.toString() === post._id.toString())
            : false;
        res.status(200).json({
            status: 'success',
            data: {
                ...post.toObject(),
                isLiked,
                isBookmarked,
                likesCount: post.likes.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPostById = getPostById;
/**
 * @desc    Delete post (owner only)
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
const deletePost = async (req, res, next) => {
    const { id } = req.params;
    try {
        const post = await Post_1.Post.findById(id);
        if (!post) {
            res.status(404);
            return next(new Error('Post not found.'));
        }
        // Check if the user is the owner
        if (post.user.toString() !== req.user?._id.toString()) {
            res.status(403);
            return next(new Error('User not authorized to delete this post.'));
        }
        // Delete image from Cloudinary
        await (0, uploadMiddleware_1.deleteFromCloudinary)(post.cloudinaryId).catch((err) => console.error('Cloudinary deletion failed on post delete:', err));
        // Delete the post
        await post.deleteOne();
        // Clean up associated comments
        await Comment_1.Comment.deleteMany({ post: id });
        // Clean up notifications linked to this post
        await Notification_1.Notification.deleteMany({ post: id });
        // Remove post from other users' bookmarks array
        await User_1.User.updateMany({ bookmarks: id }, { $pull: { bookmarks: id } });
        res.status(200).json({
            status: 'success',
            message: 'Post and all associated comments deleted successfully.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePost = deletePost;
/**
 * @desc    Like a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
const likePost = async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = req.user?._id;
    try {
        const post = await Post_1.Post.findById(id);
        if (!post) {
            res.status(404);
            return next(new Error('Post not found.'));
        }
        // Check if already liked
        if (post.likes.includes(currentUserId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'You have already liked this post.',
            });
        }
        // Add like
        post.likes.push(currentUserId);
        await post.save();
        // Create notification if the liker is not the post owner
        if (post.user.toString() !== currentUserId?.toString()) {
            await Notification_1.Notification.create({
                sender: currentUserId,
                receiver: post.user,
                type: 'like',
                post: post._id,
            });
        }
        res.status(200).json({
            status: 'success',
            message: 'Post liked successfully.',
            likesCount: post.likes.length,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.likePost = likePost;
/**
 * @desc    Unlike a post
 * @route   POST /api/posts/:id/unlike
 * @access  Private
 */
const unlikePost = async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = req.user?._id;
    try {
        const post = await Post_1.Post.findById(id);
        if (!post) {
            res.status(404);
            return next(new Error('Post not found.'));
        }
        // Check if not liked yet
        if (!post.likes.includes(currentUserId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'You have not liked this post yet.',
            });
        }
        // Remove like
        post.likes = post.likes.filter((userId) => userId.toString() !== currentUserId?.toString());
        await post.save();
        // Delete associated like notification
        await Notification_1.Notification.deleteOne({
            sender: currentUserId,
            receiver: post.user,
            type: 'like',
            post: post._id,
        });
        res.status(200).json({
            status: 'success',
            message: 'Post unliked successfully.',
            likesCount: post.likes.length,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unlikePost = unlikePost;
/**
 * @desc    Bookmark a post
 * @route   POST /api/posts/:id/bookmark
 * @access  Private
 */
const bookmarkPost = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?._id;
    try {
        const post = await Post_1.Post.findById(id);
        if (!post) {
            res.status(404);
            return next(new Error('Post not found.'));
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (user.bookmarks.includes(post._id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Post is already bookmarked.',
            });
        }
        user.bookmarks.push(post._id);
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'Post bookmarked successfully.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bookmarkPost = bookmarkPost;
/**
 * @desc    Unbookmark a post
 * @route   POST /api/posts/:id/unbookmark
 * @access  Private
 */
const unbookmarkPost = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?._id;
    try {
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404);
            return next(new Error('User not found.'));
        }
        if (!user.bookmarks.includes(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Post is not bookmarked.',
            });
        }
        user.bookmarks = user.bookmarks.filter((postId) => postId.toString() !== id);
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'Post removed from bookmarks successfully.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unbookmarkPost = unbookmarkPost;
//# sourceMappingURL=postController.js.map
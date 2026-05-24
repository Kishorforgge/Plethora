"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbookmarkPost = exports.bookmarkPost = exports.unlikePost = exports.likePost = exports.deletePost = exports.getPostById = exports.getPosts = exports.createPost = void 0;
const postService_1 = require("../services/postService");
const User_1 = require("../models/User");
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
        // Temporary testing mode
        // Remove after OAuth/JWT integration is complete
        let userId;
        if (req.user) {
            userId = req.user._id.toString();
        }
        else {
            let fallbackUser = await User_1.User.findOne({ username: 'fallback_tester' });
            if (!fallbackUser) {
                fallbackUser = await User_1.User.create({
                    username: 'fallback_tester',
                    email: 'fallback@test.com',
                    password: 'password123',
                    fullName: 'Fallback Tester',
                    bio: 'Temporary testing account'
                });
            }
            userId = fallbackUser._id.toString();
        }
        const post = await postService_1.PostService.createPost(userId, req.file.buffer, caption, tags);
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
        const searchQuery = req.query.q;
        const tagQuery = req.query.tag;
        const { posts, pagination } = await postService_1.PostService.getPosts({
            page,
            limit,
            searchQuery,
            tagQuery,
            currentUser: req.user,
        });
        res.status(200).json({
            status: 'success',
            results: posts.length,
            pagination,
            data: posts,
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
        const postData = await postService_1.PostService.getPostById(id, req.user);
        res.status(200).json({
            status: 'success',
            data: postData,
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
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        await postService_1.PostService.deletePost(id, req.user._id.toString());
        res.status(200).json({
            status: 'success',
            message: 'Post and all associated comments deleted successfully.',
        });
    }
    catch (error) {
        // Set response status code if specified on error
        if (error.statusCode) {
            res.status(error.statusCode);
        }
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
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        const likesCount = await postService_1.PostService.likePost(id, req.user._id.toString());
        res.status(200).json({
            status: 'success',
            message: 'Post liked successfully.',
            likesCount,
        });
    }
    catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }
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
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        const likesCount = await postService_1.PostService.unlikePost(id, req.user._id.toString());
        res.status(200).json({
            status: 'success',
            message: 'Post unliked successfully.',
            likesCount,
        });
    }
    catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }
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
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        await postService_1.PostService.bookmarkPost(id, req.user._id.toString());
        res.status(200).json({
            status: 'success',
            message: 'Post bookmarked successfully.',
        });
    }
    catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }
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
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        await postService_1.PostService.unbookmarkPost(id, req.user._id.toString());
        res.status(200).json({
            status: 'success',
            message: 'Post removed from bookmarks successfully.',
        });
    }
    catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }
        next(error);
    }
};
exports.unbookmarkPost = unbookmarkPost;
//# sourceMappingURL=postController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const Post_1 = require("../models/Post");
const User_1 = require("../models/User");
const Comment_1 = require("../models/Comment");
const Notification_1 = require("../models/Notification");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
class PostService {
    /**
     * Creates a new post. Uploads the image to Cloudinary, parses tags, and saves the document in MongoDB.
     *
     * @param userId The creator's user ID
     * @param fileBuffer Buffer of the uploaded file
     * @param caption Optional caption text
     * @param tags Comma-separated string or array of tags
     */
    static async createPost(userId, fileBuffer, caption = '', tags) {
        // Upload image buffer to Cloudinary
        const uploadResult = await (0, uploadMiddleware_1.uploadToCloudinary)(fileBuffer, 'plethora/posts');
        // Parse tags (supporting comma-separated string or array of strings)
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
                    .map((t) => t.toString().trim().toLowerCase())
                    .filter((t) => t !== '');
            }
        }
        // Save post record in MongoDB
        const post = await Post_1.Post.create({
            user: userId,
            imageUrl: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            caption,
            tags: tagList,
        });
        return post;
    }
    /**
     * Fetches posts based on filters with pagination, sorting, search queries, and optional current-user contextual likes/bookmarks status.
     */
    static async getPosts(options) {
        const { page, limit, searchQuery, tagQuery, currentUser } = options;
        const skip = (page - 1) * limit;
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
        const totalPosts = await Post_1.Post.countDocuments(filter);
        const posts = await Post_1.Post.find(filter)
            .populate('user', 'username fullName profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const formattedPosts = posts.map((post) => {
            const isLiked = currentUser
                ? post.likes.some((id) => id.toString() === currentUser._id.toString())
                : false;
            const isBookmarked = currentUser
                ? currentUser.bookmarks.some((id) => id.toString() === post._id.toString())
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
        return {
            posts: formattedPosts,
            pagination: {
                page,
                limit,
                totalPages,
                totalPosts,
                hasMore,
            },
        };
    }
    /**
     * Fetches a single post by ID with optional current-user contextual statuses.
     */
    static async getPostById(postId, currentUser) {
        const post = await Post_1.Post.findById(postId).populate('user', 'username fullName profilePicture');
        if (!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        const isLiked = currentUser
            ? post.likes.some((userId) => userId.toString() === currentUser._id.toString())
            : false;
        const isBookmarked = currentUser
            ? currentUser.bookmarks.some((id) => id.toString() === post._id.toString())
            : false;
        return {
            ...post.toObject(),
            isLiked,
            isBookmarked,
            likesCount: post.likes.length,
        };
    }
    /**
     * Deletes a post, deletes its media from Cloudinary, and cleans up all related comments, notifications, and bookmarks.
     */
    static async deletePost(postId, userId) {
        const post = await Post_1.Post.findById(postId);
        if (!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        // Check if the user is the owner
        if (post.user.toString() !== userId) {
            const error = new Error('User not authorized to delete this post.');
            error.statusCode = 403;
            throw error;
        }
        // Delete image from Cloudinary
        await (0, uploadMiddleware_1.deleteFromCloudinary)(post.cloudinaryId).catch((err) => console.error('Cloudinary deletion failed on post delete:', err));
        // Delete the post document
        await post.deleteOne();
        // Clean up associated comments
        await Comment_1.Comment.deleteMany({ post: postId });
        // Clean up notifications linked to this post
        await Notification_1.Notification.deleteMany({ post: postId });
        // Remove post from other users' bookmarks array
        await User_1.User.updateMany({ bookmarks: postId }, { $pull: { bookmarks: postId } });
    }
    /**
     * Adds a like to the post. Creates a notification if the liker is not the post owner.
     */
    static async likePost(postId, currentUserId) {
        const post = await Post_1.Post.findById(postId);
        if (!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        if (post.likes.includes(currentUserId)) {
            const error = new Error('You have already liked this post.');
            error.statusCode = 400;
            throw error;
        }
        post.likes.push(currentUserId);
        await post.save();
        // Create notification if the liker is not the post owner
        if (post.user.toString() !== currentUserId) {
            await Notification_1.Notification.create({
                sender: currentUserId,
                receiver: post.user,
                type: 'like',
                post: post._id,
            });
        }
        return post.likes.length;
    }
    /**
     * Removes a like from the post and deletes the associated notification.
     */
    static async unlikePost(postId, currentUserId) {
        const post = await Post_1.Post.findById(postId);
        if (!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        if (!post.likes.includes(currentUserId)) {
            const error = new Error('You have not liked this post yet.');
            error.statusCode = 400;
            throw error;
        }
        post.likes = post.likes.filter((userId) => userId.toString() !== currentUserId);
        await post.save();
        // Delete associated like notification
        await Notification_1.Notification.deleteOne({
            sender: currentUserId,
            receiver: post.user,
            type: 'like',
            post: post._id,
        });
        return post.likes.length;
    }
    /**
     * Bookmarks a post for the user.
     */
    static async bookmarkPost(postId, userId) {
        const post = await Post_1.Post.findById(postId);
        if (!post) {
            const error = new Error('Post not found.');
            error.statusCode = 404;
            throw error;
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        if (user.bookmarks.includes(post._id)) {
            const error = new Error('Post is already bookmarked.');
            error.statusCode = 400;
            throw error;
        }
        user.bookmarks.push(post._id);
        await user.save();
    }
    /**
     * Unbookmarks a post for the user.
     */
    static async unbookmarkPost(postId, userId) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        if (!user.bookmarks.includes(postId)) {
            const error = new Error('Post is not bookmarked.');
            error.statusCode = 400;
            throw error;
        }
        user.bookmarks = user.bookmarks.filter((id) => id.toString() !== postId);
        await user.save();
    }
}
exports.PostService = PostService;
//# sourceMappingURL=postService.js.map
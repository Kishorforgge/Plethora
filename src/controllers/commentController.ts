import { Response, NextFunction } from 'express';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

type PopulatedCommentDoc = {
  _id: unknown;
  post: unknown;
  user: { _id: unknown; username: string; profilePicture: string };
  text: string;
  createdAt: Date;
};

const formatComment = (comment: PopulatedCommentDoc) => ({
  _id: comment._id,
  postId: comment.post,
  userId: comment.user._id,
  username: comment.user.username,
  profilePicture: comment.user.profilePicture,
  text: comment.text,
  createdAt: comment.createdAt,
});

/**
 * @desc    Add a comment to a post
 * @route   POST /api/comments/:postId
 * @access  Private
 */
export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.user?._id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found.'));
    }

    // Create and save comment
    const comment = await Comment.create({
      post: postId,
      user: userId,
      text,
    });

    // Increment comment count on the post
    post.commentsCount += 1;
    await post.save();

    // Populate user info for the response
    const populatedComment = await comment.populate('user', 'username fullName profilePicture');

    // Create notification if the commenter is not the post owner
    if (post.user.toString() !== userId?.toString()) {
      await Notification.create({
        sender: userId,
        receiver: post.user,
        type: 'comment',
        post: post._id,
        comment: comment._id,
      });
    }

    res.status(201).json({
      status: 'success',
      data: formatComment(populatedComment as unknown as PopulatedCommentDoc),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comments for a post (paginated)
 * @route   GET /api/comments/:postId
 * @access  Public
 */
export const getCommentsByPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const skip = (page - 1) * limit;

  try {
    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      res.status(404);
      return next(new Error('Post not found.'));
    }

    const totalComments = await Comment.countDocuments({ post: postId });

    const comments = await Comment.find({ post: postId })
      .populate('user', 'username fullName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalComments / limit);
    const hasMore = page < totalPages;

    res.status(200).json({
      status: 'success',
      results: comments.length,
      pagination: {
        page,
        limit,
        totalPages,
        totalPosts: totalComments,
        hasMore,
      },
      data: comments.map((c) => formatComment(c as unknown as PopulatedCommentDoc)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private
 */
export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found.'));
    }

    const post = await Post.findById(comment.post);
    if (!post) {
      res.status(404);
      return next(new Error('Post associated with this comment not found.'));
    }

    if (comment.user.toString() !== userId?.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this comment.'));
    }

    // Delete comment
    await comment.deleteOne();

    // Decrement comment count on the post
    if (post.commentsCount > 0) {
      post.commentsCount -= 1;
      await post.save();
    }

    // Delete notifications associated with this comment
    await Notification.deleteMany({ comment: commentId });

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:commentId
 * @access  Private (comment owner only)
 */
export const updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { commentId } = req.params;
  const { text } = req.body;
  const userId = req.user?._id;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found.'));
    }

    if (comment.user.toString() !== userId?.toString()) {
      res.status(403);
      return next(new Error('Not authorized to update this comment.'));
    }

    comment.text = text.trim();
    await comment.save();

    const populatedComment = await comment.populate('user', 'username profilePicture');

    res.status(200).json({
      status: 'success',
      data: formatComment(populatedComment as unknown as PopulatedCommentDoc),
    });
  } catch (error) {
    next(error);
  }
};

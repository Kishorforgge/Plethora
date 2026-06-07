import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PostService } from '../services/postService';

/**
 * @desc    Upload an image post
 * @route   POST /api/posts/upload
 * @access  Private
 */
export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const post = await PostService.createPost(
      req.user._id.toString(),
      req.file.buffer,
      caption,
      tags
    );

    res.status(201).json({
      status: 'success',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch all posts with pagination, search, and tag filters
 * @route   GET /api/posts
 * @access  Public (Optional Authentication to populate user-specific like/bookmark states)
 */
export const getFollowingFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { posts, pagination } = await PostService.getFollowingFeed({
      page,
      limit,
      currentUser: req.user,
    });

    res.status(200).json({
      status: 'success',
      results: posts.length,
      pagination,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchQuery = req.query.q as string;
    const tagQuery = req.query.tag as string;

    const { posts, pagination } = await PostService.getPosts({
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch a single post by ID
 * @route   GET /api/posts/:id
 * @access  Public (Optional Authentication)
 */
export const getPostById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const postData = await PostService.getPostById(id, req.user);

    res.status(200).json({
      status: 'success',
      data: postData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete post (owner only)
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    await PostService.deletePost(id, req.user._id.toString());

    res.status(200).json({
      status: 'success',
      message: 'Post and all associated comments deleted successfully.',
    });
  } catch (error) {
    // Set response status code if specified on error
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Like a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
export const likePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const likesCount = await PostService.likePost(id, req.user._id.toString());

    res.status(200).json({
      status: 'success',
      message: 'Post liked successfully.',
      data: { likesCount },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Unlike a post
 * @route   POST /api/posts/:id/unlike
 * @access  Private
 */
export const unlikePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const likesCount = await PostService.unlikePost(id, req.user._id.toString());

    res.status(200).json({
      status: 'success',
      message: 'Post unliked successfully.',
      data: { likesCount },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Bookmark a post
 * @route   POST /api/posts/:id/bookmark
 * @access  Private
 */
export const bookmarkPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    await PostService.bookmarkPost(id, req.user._id.toString());

    res.status(200).json({
      status: 'success',
      message: 'Post bookmarked successfully.',
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Unbookmark a post
 * @route   POST /api/posts/:id/unbookmark
 * @access  Private
 */
export const getMyUploads = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }
    const posts = await PostService.getPostsByUser(req.user._id.toString(), req.user);
    res.status(200).json({ status: 'success', results: posts.length, data: posts });
  } catch (error) {
    next(error);
  }
};

export const getMySaved = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }
    const posts = await PostService.getSavedPosts(req.user._id.toString(), req.user);
    res.status(200).json({ status: 'success', results: posts.length, data: posts });
  } catch (error) {
    if ((error as any).statusCode) res.status((error as any).statusCode);
    next(error);
  }
};

export const getMyLiked = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }
    const posts = await PostService.getLikedPosts(req.user._id.toString(), req.user);
    res.status(200).json({ status: 'success', results: posts.length, data: posts });
  } catch (error) {
    next(error);
  }
};

export const unbookmarkPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    await PostService.unbookmarkPost(id, req.user._id.toString());

    res.status(200).json({
      status: 'success',
      message: 'Post removed from bookmarks successfully.',
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error);
  }
};

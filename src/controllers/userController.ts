import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { uploadToCloudinary as cloudUpload, deleteFromCloudinary as cloudDelete } from '../middleware/uploadMiddleware';

/**
 * @desc    Edit user profile (fullName, bio)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { fullName, bio } = req.body;

  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;

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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload/Update profile picture
 * @route   PUT /api/users/profile-picture
 * @access  Private
 */
export const updateProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    if (!req.file) {
      res.status(400);
      return next(new Error('Please provide an image file to upload.'));
    }

    // Upload new image to Cloudinary
    const uploadResult = await cloudUpload(req.file.buffer, 'plethora/avatars');

    // Delete old profile picture from Cloudinary if it exists and is not the default
    if (user.cloudinaryId) {
      await cloudDelete(user.cloudinaryId).catch((err) =>
        console.error('Failed to delete old avatar from Cloudinary:', err)
      );
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Follow a user
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
export const followUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.id;
  const currentUserId = req.user?._id;

  try {
    if (targetId === currentUserId?.toString()) {
      res.status(400);
      return next(new Error('You cannot follow yourself.'));
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    // Check if already following
    if (currentUser.following.includes(targetUser._id as any)) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already following this user.',
      });
    }

    // Update follow arrays
    currentUser.following.push(targetUser._id as any);
    targetUser.followers.push(currentUser._id as any);

    await currentUser.save();
    await targetUser.save();

    // Create a follow notification
    await Notification.create({
      sender: currentUser._id,
      receiver: targetUser._id,
      type: 'follow',
    });

    res.status(200).json({
      status: 'success',
      message: `You are now following ${targetUser.username}.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unfollow a user
 * @route   POST /api/users/:id/unfollow
 * @access  Private
 */
export const unfollowUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.id;
  const currentUserId = req.user?._id;

  try {
    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    // Check if not following
    if (!currentUser.following.includes(targetUser._id as any)) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are not following this user.',
      });
    }

    // Remove from arrays
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUser._id.toString()
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await targetUser.save();

    // Optional: Delete follow notifications sender->receiver
    await Notification.deleteMany({
      sender: currentUser._id,
      receiver: targetUser._id,
      type: 'follow',
    });

    res.status(200).json({
      status: 'success',
      message: `You have unfollowed ${targetUser.username}.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users by username or fullName
 * @route   GET /api/users/search
 * @access  Public (or Private, typically accessible)
 */
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  const query = req.query.q as string;

  try {
    if (!query) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    // Regex match username or fullName
    const users = await User.find({
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
    }));

    res.status(200).json({
      status: 'success',
      results: formattedUsers.length,
      data: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username: username.toLowerCase() });

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
  } catch (error) {
    next(error);
  }
};

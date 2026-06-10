import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { uploadToCloudinary as cloudUpload, deleteFromCloudinary as cloudDelete } from '../middleware/uploadMiddleware';
import { broadcastEvent } from '../socket';

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

    // Broadcast follow update in real-time
    broadcastEvent('follow_update', {
      followerId: currentUser._id.toString(),
      followingId: targetUser._id.toString(),
      action: 'follow',
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

    // Broadcast unfollow update in real-time
    broadcastEvent('follow_update', {
      followerId: currentUser._id.toString(),
      followingId: targetUser._id.toString(),
      action: 'unfollow',
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
 * @desc    Suggested creators to follow (sorted by popularity)
 * @route   GET /api/users/suggested
 * @access  Private
 */
export const getSuggestedCreators = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const users = await User.find({
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
        isFollowing: req.user!.following.some((id) => id.toString() === u._id.toString()),
      }));

    res.status(200).json({
      status: 'success',
      results: sorted.length,
      data: sorted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's followers list
 * @route   GET /api/users/me/followers
 * @access  Private
 */
export const getMyFollowers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const user = await User.findById(req.user._id).populate(
      'followers',
      'username fullName profilePicture'
    );
    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    const followers = (user.followers as any[]).map((f) => ({
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's following list
 * @route   GET /api/users/me/following
 * @access  Private
 */
export const getMyFollowing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const user = await User.findById(req.user._id).populate(
      'following',
      'username fullName profilePicture'
    );
    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    const following = (user.following as any[]).map((f) => ({
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users by username or fullName
 * @route   GET /api/users/search
 * @access  Public (or Private, typically accessible)
 */
export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const query = req.query.q as string;

  try {
    if (!query) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    // Regex match username or fullName, excluding dummy accounts
    const users = await User.find({
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
    if (/^(fallback|test|demo|seed|placeholder)/i.test(username)) {
      res.status(404);
      return next(new Error('User not found.'));
    }
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

/**
 * @desc    Get followers of any user (by userId)
 * @route   GET /api/users/:userId/followers
 * @access  Private
 */
export const getUserFollowers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate(
      'followers',
      'username fullName profilePicture isVerified'
    );

    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    const currentUser = req.user ? await User.findById(req.user._id) : null;
    const blockedIds = currentUser?.blockedUsers?.map((id) => id.toString()) || [];
    const mutedIds = currentUser?.mutedUsers?.map((id) => id.toString()) || [];

    const followers = (user.followers as any[]).map((f) => ({
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get following of any user (by userId)
 * @route   GET /api/users/:userId/following
 * @access  Private
 */
export const getUserFollowing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate(
      'following',
      'username fullName profilePicture isVerified'
    );

    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    const currentUser = req.user ? await User.findById(req.user._id) : null;
    const blockedIds = currentUser?.blockedUsers?.map((id) => id.toString()) || [];
    const mutedIds = currentUser?.mutedUsers?.map((id) => id.toString()) || [];

    const following = (user.following as any[]).map((f) => ({
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search followers and following by query
 * @route   GET /api/users/search-followers
 * @access  Private
 */
export const searchFollowersAndFollowing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const query = req.query.q as string;
  const currentUserId = req.user?._id;

  try {
    if (!currentUserId) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    if (!query) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    const connectionIds = Array.from(new Set([
      ...currentUser.followers.map(id => id.toString()),
      ...currentUser.following.map(id => id.toString())
    ]));

    const users = await User.find({
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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a follower (make them unfollow you)
 * @route   POST /api/users/:id/remove-follower
 * @access  Private
 */
export const removeFollower = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.id; // The follower to remove
  const currentUserId = req.user?._id;

  try {
    const followerUser = await User.findById(targetId);
    const currentUser = await User.findById(currentUserId);

    if (!followerUser || !currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    // Check if they are actually a follower
    if (!currentUser.followers.includes(followerUser._id as any)) {
      res.status(400);
      return next(new Error('This user is not following you.'));
    }

    // Remove follower from current user's followers array
    currentUser.followers = currentUser.followers.filter(
      (id) => id.toString() !== followerUser._id.toString()
    );

    // Remove current user from follower's following array
    followerUser.following = followerUser.following.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await followerUser.save();

    // Broadcast unfollow/follow update in real-time
    broadcastEvent('follow_update', {
      followerId: followerUser._id.toString(),
      followingId: currentUser._id.toString(),
      action: 'unfollow',
    });

    res.status(200).json({
      status: 'success',
      message: `Removed ${followerUser.username} from your followers.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Block a user
 * @route   POST /api/users/:id/block
 * @access  Private
 */
export const blockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.id;
  const currentUserId = req.user?._id;

  try {
    if (targetId === currentUserId?.toString()) {
      res.status(400);
      return next(new Error('You cannot block yourself.'));
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    if (!currentUser.blockedUsers) {
      currentUser.blockedUsers = [];
    }

    if (!currentUser.blockedUsers.includes(targetId as any)) {
      currentUser.blockedUsers.push(targetId as any);
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      isBlocked: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unblock a user
 * @route   POST /api/users/:id/unblock
 * @access  Private
 */
export const unblockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.id;
  const currentUserId = req.user?._id;

  try {
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    if (currentUser.blockedUsers) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => id.toString() !== targetId
      );
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      isBlocked: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mute a user
 * @route   POST /api/users/:id/mute
 * @access  Private
 */
export const muteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.id;
  const currentUserId = req.user?._id;

  try {
    if (targetId === currentUserId?.toString()) {
      res.status(400);
      return next(new Error('You cannot mute yourself.'));
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    if (!currentUser.mutedUsers) {
      currentUser.mutedUsers = [];
    }

    if (!currentUser.mutedUsers.includes(targetId as any)) {
      currentUser.mutedUsers.push(targetId as any);
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      isMuted: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unmute a user
 * @route   POST /api/users/:id/unmute
 * @access  Private
 */
export const unmuteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const targetId = req.params.id;
  const currentUserId = req.user?._id;

  try {
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    if (currentUser.mutedUsers) {
      currentUser.mutedUsers = currentUser.mutedUsers.filter(
        (id) => id.toString() !== targetId
      );
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      isMuted: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile by username including postsCount
 * @route   GET /api/users/profile/:username
 * @access  Public (Optional auth)
 */
export const getUserProfileByUsername = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username } = req.params;

  try {
    if (/^(fallback|test|demo|seed|placeholder)/i.test(username)) {
      res.status(404);
      return next(new Error('User not found.'));
    }
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      res.status(404);
      return next(new Error('User not found.'));
    }

    const postsCount = await Post.countDocuments({ user: user._id });

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
  } catch (error) {
    next(error);
  }
};



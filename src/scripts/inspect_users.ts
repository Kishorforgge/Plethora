import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

async function inspectUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    const users = await User.find({});
    console.log('=== USERS DETAILS ===');
    for (const u of users) {
      const postsCount = await Post.countDocuments({ user: u._id });
      const commentsCount = await Comment.countDocuments({ user: u._id });
      const messagesSent = await Message.countDocuments({ sender: u._id });
      const notificationsSent = await Notification.countDocuments({ sender: u._id });
      const notificationsReceived = await Notification.countDocuments({ receiver: u._id });
      
      console.log(JSON.stringify({
        id: u._id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        googleId: u.googleId || null,
        hasPassword: !!u.password,
        profilePicture: u.profilePicture,
        followersCount: u.followers.length,
        followingCount: u.following.length,
        bookmarksCount: u.bookmarks.length,
        postsCount,
        commentsCount,
        messagesSent,
        notificationsSent,
        notificationsReceived,
        createdAt: u.createdAt
      }, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectUsers();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { Notification } from '../models/Notification';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

async function migrateAndClean() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    // 1. Locate the target authenticated user
    const targetUsername = 'akash7559';
    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      console.error(`Target user "${targetUsername}" not found. Cannot proceed with post migration.`);
      process.exit(1);
    }
    const targetUserId = targetUser._id;
    console.log(`Found target user: @${targetUsername} (${targetUserId})`);

    // 2. Identify all dummy/test users
    // Select password field explicitly because it is select: false
    const allUsers = await User.find({}).select('+password');
    const dummyUsersList: any[] = [];
    const dummyUserIds: mongoose.Types.ObjectId[] = [];

    const dummyUsernameRegex = /^(fallback|test|demo|seed|placeholder)/i;
    const defaultAvatarUrl = 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png';

    for (const u of allUsers) {
      // Don't delete our target user!
      if (u.username === targetUsername) continue;

      const postsCount = await Post.countDocuments({ user: u._id });
      const commentsCount = await Comment.countDocuments({ user: u._id });

      const matchesName = dummyUsernameRegex.test(u.username);
      const isUnauthenticated = !u.googleId && !u.password;
      const isDefaultAvatarNoActivity = u.profilePicture === defaultAvatarUrl && postsCount === 0 && commentsCount === 0;

      if (matchesName || isUnauthenticated || isDefaultAvatarNoActivity) {
        dummyUsersList.push(u);
        dummyUserIds.push(u._id as mongoose.Types.ObjectId);
      }
    }

    if (dummyUsersList.length === 0) {
      console.log('No dummy or test users found in the database. Cleanup already completed!');
      process.exit(0);
    }

    console.log(`Found ${dummyUsersList.length} dummy/test users to remove:`);
    dummyUsersList.forEach(u => {
      console.log(` - ID: ${u._id}, Username: ${u.username}, Email: ${u.email}`);
    });

    // 3. Migrate posts to targetUser
    console.log('\n--- Migrating Posts ---');
    const postsToMigrate = await Post.find({ user: { $in: dummyUserIds } });
    console.log(`Found ${postsToMigrate.length} posts belonging to dummy users.`);

    if (postsToMigrate.length > 0) {
      const migrationResult = await Post.updateMany(
        { user: { $in: dummyUserIds } },
        { $set: { user: targetUserId } }
      );
      console.log(`Successfully migrated ${migrationResult.modifiedCount} posts to @${targetUsername}.`);
    }

    // 4. Update every affected collection: likes, comments, follows, messages, conversations, notifications

    // A. Clean up likes on all posts
    console.log('\n--- Cleaning Up Likes ---');
    const likesCleanupResult = await Post.updateMany(
      { likes: { $in: dummyUserIds } },
      { $pull: { likes: { $in: dummyUserIds } } }
    );
    console.log(`Removed dummy users from likes in ${likesCleanupResult.modifiedCount} posts.`);

    // B. Clean up comments
    console.log('\n--- Cleaning Up Comments ---');
    const commentsToDelete = await Comment.find({ user: { $in: dummyUserIds } });
    console.log(`Found ${commentsToDelete.length} comments written by dummy users.`);
    
    if (commentsToDelete.length > 0) {
      // Group comment count changes by post
      const postCommentCounts: Record<string, number> = {};
      for (const comment of commentsToDelete) {
        const postIdStr = comment.post.toString();
        postCommentCounts[postIdStr] = (postCommentCounts[postIdStr] || 0) + 1;
      }

      // Delete comments
      const commentDeleteResult = await Comment.deleteMany({ user: { $in: dummyUserIds } });
      console.log(`Deleted ${commentDeleteResult.deletedCount} comment documents.`);

      // Adjust commentsCount on affected posts
      let postsCountUpdated = 0;
      for (const [postIdStr, count] of Object.entries(postCommentCounts)) {
        await Post.findByIdAndUpdate(postIdStr, { $inc: { commentsCount: -count } });
        postsCountUpdated++;
      }
      console.log(`Updated commentsCount field on ${postsCountUpdated} posts.`);
    }

    // C. Clean up follows (followers and following arrays of remaining users)
    console.log('\n--- Cleaning Up Follows ---');
    const followersCleanup = await User.updateMany(
      { followers: { $in: dummyUserIds } },
      { $pull: { followers: { $in: dummyUserIds } } }
    );
    const followingCleanup = await User.updateMany(
      { following: { $in: dummyUserIds } },
      { $pull: { following: { $in: dummyUserIds } } }
    );
    console.log(`Cleaned up followers list on ${followersCleanup.modifiedCount} users.`);
    console.log(`Cleaned up following list on ${followingCleanup.modifiedCount} users.`);

    // D. Clean up messages
    console.log('\n--- Cleaning Up Messages ---');
    const messagesDeleteResult = await Message.deleteMany({ sender: { $in: dummyUserIds } });
    console.log(`Deleted ${messagesDeleteResult.deletedCount} messages sent by dummy users.`);

    // E. Clean up conversations
    console.log('\n--- Cleaning Up Conversations ---');
    // Pull dummy users from conversation participants
    const convoPullResult = await Conversation.updateMany(
      { participants: { $in: dummyUserIds } },
      { $pull: { participants: { $in: dummyUserIds } } }
    );
    console.log(`Removed dummy users from participant lists of ${convoPullResult.modifiedCount} conversations.`);

    // Delete conversations with less than 2 participants left
    const allConversations = await Conversation.find({});
    let deletedConvoCount = 0;
    let deletedMsgsInOrphanedConvo = 0;
    
    for (const convo of allConversations) {
      if (convo.participants.length < 2) {
        deletedConvoCount++;
        // Delete messages in this conversation
        const msgDel = await Message.deleteMany({ conversation: convo._id });
        deletedMsgsInOrphanedConvo += msgDel.deletedCount;
        // Delete conversation itself
        await Conversation.deleteOne({ _id: convo._id });
      }
    }
    console.log(`Deleted ${deletedConvoCount} conversations with fewer than 2 participants remaining, cleaning up ${deletedMsgsInOrphanedConvo} associated messages.`);

    // F. Clean up notifications
    console.log('\n--- Cleaning Up Notifications ---');
    const notificationsCleanupResult = await Notification.deleteMany({
      $or: [
        { sender: { $in: dummyUserIds } },
        { receiver: { $in: dummyUserIds } }
      ]
    });
    console.log(`Deleted ${notificationsCleanupResult.deletedCount} notifications involving dummy users.`);

    // 5. Delete user documents
    console.log('\n--- Deleting Dummy User Documents ---');
    const userDeleteResult = await User.deleteMany({ _id: { $in: dummyUserIds } });
    console.log(`Successfully deleted ${userDeleteResult.deletedCount} dummy user accounts.`);

    console.log('\n=========================================');
    console.log(' MIGRATION AND CLEANUP COMPLETE');
    console.log('=========================================');
    console.log(`Total users deleted: ${userDeleteResult.deletedCount}`);
    console.log(`Total posts migrated: ${postsToMigrate.length}`);
    console.log('Collections updated: posts, comments, likes, follows, messages, conversations, notifications');
    console.log('=========================================');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed with error:', err);
    process.exit(1);
  }
}

migrateAndClean();

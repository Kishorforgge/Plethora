import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Notification } from '../models/Notification';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

async function runCleanup() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database successfully.');

    // 1. Delete the fallback_tester user to ensure they are deleted as requested
    const deleteUserResult = await User.deleteOne({ username: 'fallback_tester' });
    if (deleteUserResult.deletedCount > 0) {
      console.log('Deleted user fallback_tester from User collection.');
    } else {
      console.log('User fallback_tester did not exist or was already deleted.');
    }

    // 2. Find all posts and clean up orphaned ones
    const posts = await Post.find({});
    console.log(`Found ${posts.length} total posts in the database before cleanup.`);

    let orphanedCount = 0;
    const orphanedDetails = [];

    for (const post of posts) {
      // Check if referenced user exists
      const userExists = await User.exists({ _id: post.user });
      
      if (!userExists) {
        orphanedCount++;
        orphanedDetails.push({
          postId: post._id,
          caption: post.caption,
          userIdRef: post.user,
        });

        console.log(`Found orphaned post: ID=${post._id}, Caption="${post.caption}", UserIDRef=${post.user}`);

        // Delete the orphaned post document
        await Post.deleteOne({ _id: post._id });

        // Clean up associated comments
        await Comment.deleteMany({ post: post._id });
        
        // Clean up associated notifications
        await Notification.deleteMany({ post: post._id });

        // Remove from bookmarks
        await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } });

        console.log(`Cleaned up orphaned post ${post._id} and its associated comments/notifications.`);
      }
    }

    console.log('\n--- Cleanup Summary ---');
    console.log(`Total orphaned posts found and removed: ${orphanedCount}`);
    if (orphanedDetails.length > 0) {
      console.log('Details:');
      console.log(JSON.stringify(orphanedDetails, null, 2));
    }
    console.log('-----------------------');

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed with error:', error);
    process.exit(1);
  }
}

runCleanup();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

async function inspectDb() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    const users = await User.find({});
    console.log('--- USERS ---');
    users.forEach(u => {
      console.log(`ID: ${u._id}, Username: ${u.username}, FullName: ${u.fullName}`);
    });

    const posts = await Post.find({});
    console.log('\n--- POSTS ---');
    for (const p of posts) {
      const u = await User.findById(p.user);
      console.log(`ID: ${p._id}, UserIDRef: ${p.user}, CreatorExists: ${!!u}, Caption: "${p.caption}"`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectDb();

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

async function inspect() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not initialized');
    }

    const posts = await db.collection('posts').find({}).toArray();
    console.log(`TOTAL POSTS: ${posts.length}`);
    posts.forEach((p, idx) => {
      console.log(`${idx + 1}. ID: ${p._id}`);
      console.log(`   Caption: "${p.caption}"`);
      console.log(`   Tags: ${JSON.stringify(p.tags)}`);
      console.log(`   Category: "${p.category}"`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

async function checkPosts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not initialized');
    }

    const rawPosts = await db.collection('posts').find({}).limit(5).toArray();
    console.log('RAW POST STRUCTURE SAMPLE (First 5):');
    console.log(JSON.stringify(rawPosts, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPosts();

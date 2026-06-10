import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

async function countMissing() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not initialized');
    }

    const posts = await db.collection('posts').find({}).toArray();
    
    const missing = posts.filter(p => !p.category || p.category.trim() === '');
    
    console.log('--- MISSING CATEGORY REPORT ---');
    console.log(`Total posts in database: ${posts.length}`);
    console.log(`Posts with missing/empty category: ${missing.length}`);
    
    if (missing.length > 0) {
      console.log('Sample posts with missing categories:');
      missing.forEach(p => {
        console.log(` - ID: ${p._id}, Title/Caption: "${p.caption}", Category: ${p.category}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

countMissing();

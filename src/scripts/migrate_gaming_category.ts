import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

const gamingKeywords = [
  'sekiro',
  'black myth',
  'wukong',
  'skyrim',
  'elden ring',
  'god of war',
  'gaming',
  'game'
];

async function migrateGaming() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not initialized');
    }

    const posts = await db.collection('posts').find({}).toArray();
    console.log(`Found ${posts.length} total posts. Checking for gaming content...`);

    let movedCount = 0;
    const movedDetails: any[] = [];

    for (const p of posts) {
      const captionText = (p.caption || '').toLowerCase();
      const tags = (p.tags || []).map((t: string) => t.toLowerCase());
      
      const isGaming = 
        gamingKeywords.some(keyword => captionText.includes(keyword)) ||
        gamingKeywords.some(keyword => tags.includes(keyword));

      if (isGaming) {
        movedCount++;
        
        // Extract title logic matching frontend mapApiPostToDisplay
        const hasSeparator = p.caption?.includes(' — ');
        const title = hasSeparator 
          ? p.caption.split(' — ')[0] 
          : (p.caption?.slice(0, 50) || 'Untitled');

        movedDetails.push({
          id: p._id,
          title: title,
          caption: p.caption,
          oldCategory: p.category,
        });

        // Set category to Gaming
        await db.collection('posts').updateOne(
          { _id: p._id },
          { $set: { category: 'Gaming' } }
        );
        console.log(` -> Updated post "${title}" to category "Gaming"`);
      }
    }

    console.log('\n=========================================');
    console.log(' GAMING CATEGORY MIGRATION SUMMARY');
    console.log('=========================================');
    console.log(`Total posts moved to Gaming: ${movedCount}`);
    console.log('Details:');
    console.log(JSON.stringify(movedDetails, null, 2));
    console.log('=========================================');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrateGaming();

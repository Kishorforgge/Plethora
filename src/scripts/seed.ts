import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plethora';

const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const creators = [
  { username: 'elena.rossi', fullName: 'Elena Rossi', avatar: u('1494790108377-be9c29b29330', 200), bio: 'Architect. Light archivist.' },
  { username: 'marcus.chen', fullName: 'Marcus Chen', avatar: u('1500648767791-00dcc994a43e', 200), bio: 'Spatial design & quiet objects.' },
  { username: 'ayanna.k', fullName: 'Ayanna Kelly', avatar: u('1438761681033-6461ffad8d80', 200), bio: 'Editorial photographer.' },
  { username: 'ren.takeda', fullName: 'Ren Takeda', avatar: u('1535713875002-d1d0cf377fde', 200), bio: 'Minimalism is a discipline.' },
  { username: 'juno.west', fullName: 'Juno West', avatar: u('1534528741775-53994a69daeb', 200), bio: 'Material studies.' },
  { username: 'amir.h', fullName: 'Amir Hassan', avatar: u('1463453091185-61582044d556', 200), bio: 'Mountain documentarian.' },
];

const palette = [
  { imageId: '1487958449943-2429e8be8625', width: 800, height: 1200, title: 'Stairwell No. 4', caption: 'Concrete, light, repetition.', tags: ['architecture', 'brutalism'], creatorIdx: 0 },
  { imageId: '1493809842364-78817add7ffb', width: 800, height: 800, title: 'Folded Linen', caption: 'A study in soft folds.', tags: ['textile', 'study'], creatorIdx: 1 },
  { imageId: '1494522855154-9297ac14b55f', width: 800, height: 1000, title: 'Morning Espresso', caption: 'First light, last cup.', tags: ['object', 'morning'], creatorIdx: 2 },
  { imageId: '1469474968028-56623f02e42e', width: 800, height: 1200, title: 'Mountain Fog', caption: 'Distance dissolving.', tags: ['landscape', 'fog'], creatorIdx: 5 },
  { imageId: '1416339306562-f3d12fefd36f', width: 800, height: 1200, title: 'Forest Cathedral', caption: '', tags: ['nature', 'forest'], creatorIdx: 5 },
  { imageId: '1441974231531-c6227db76b6e', width: 800, height: 1000, title: 'Palm Shadow', caption: 'Light writing on walls.', tags: ['light', 'minimal'], creatorIdx: 3 },
  { imageId: '1518791841217-8f162f1e1131', width: 800, height: 800, title: 'Soft Companion', caption: '', tags: ['nature', 'warm'], creatorIdx: 4 },
  { imageId: '1502082553048-f009c37129b9', width: 800, height: 1200, title: 'Highway North', caption: '', tags: ['landscape', 'road'], creatorIdx: 5 },
  { imageId: '1517021897933-0e0319cfbc28', width: 800, height: 1000, title: 'Garden Rooms', caption: '', tags: ['nature', 'garden'], creatorIdx: 0 },
  { imageId: '1470071459604-3b5ec3a7fe05', width: 800, height: 1200, title: 'Fjord Quiet', caption: '', tags: ['landscape', 'water'], creatorIdx: 5 },
  { imageId: '1444065381814-865dc9da92c0', width: 800, height: 800, title: 'Citrus Study', caption: '', tags: ['still-life', 'warm'], creatorIdx: 4 },
  { imageId: '1465146344425-f00d5f5c8f07', width: 800, height: 1000, title: 'Bloom', caption: '', tags: ['floral', 'soft'], creatorIdx: 2 },
  { imageId: '1426604966848-d7adac402bff', width: 800, height: 1200, title: 'Glacier Edge', caption: '', tags: ['landscape', 'ice'], creatorIdx: 5 },
  { imageId: '1501785888041-af3ef285b470', width: 800, height: 800, title: 'Reflection Pool', caption: '', tags: ['water', 'minimal'], creatorIdx: 1 },
  { imageId: '1472214103451-9374bd1c798e', width: 800, height: 1100, title: 'Hillside', caption: '', tags: ['landscape', 'warm'], creatorIdx: 5 },
  { imageId: '1500534314209-a25ddb2bd429', width: 800, height: 1000, title: 'Hidden Lake', caption: '', tags: ['water', 'calm'], creatorIdx: 4 },
  { imageId: '1490750967868-88aa4486c946', width: 800, height: 1200, title: 'Petal Geometry', caption: '', tags: ['floral', 'macro'], creatorIdx: 2 },
  { imageId: '1455218873509-8097305ee378', width: 800, height: 800, title: 'Drift', caption: '', tags: ['mood', 'calm'], creatorIdx: 3 },
  { imageId: '1418065460487-3e41a6c84dc5', width: 800, height: 1100, title: 'Coastal Line', caption: '', tags: ['water', 'horizon'], creatorIdx: 5 },
  { imageId: '1447752875215-b2761acb3c5d', width: 800, height: 1200, title: 'Tall Trees', caption: '', tags: ['forest', 'vertical'], creatorIdx: 0 },
  { imageId: '1505765050516-f72dcac9c60e', width: 800, height: 900, title: 'Wave Memory', caption: '', tags: ['water', 'motion'], creatorIdx: 4 },
  { imageId: '1502318217862-aa4e294ba657', width: 800, height: 1100, title: 'Tiled Geometry', caption: '', tags: ['pattern', 'warm'], creatorIdx: 1 },
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database successfully.');

    // 1. Seed creators (Users)
    console.log('Seeding creators...');
    const userMap: Record<string, mongoose.Types.ObjectId> = {};
    
    for (const c of creators) {
      let user = await User.findOne({ username: c.username });
      
      if (!user) {
        user = await User.create({
          username: c.username,
          email: `${c.username}@plethora.placeholder`,
          fullName: c.fullName,
          bio: c.bio,
          profilePicture: c.avatar,
        });
        console.log(`Created user: ${c.username}`);
      } else {
        // Update profile picture and details if they exist
        user.fullName = c.fullName;
        user.bio = c.bio;
        user.profilePicture = c.avatar;
        await user.save();
        console.log(`Updated existing user: ${c.username}`);
      }
      userMap[c.username] = user._id as mongoose.Types.ObjectId;
    }

    // 2. Seed posts
    console.log('Seeding posts...');
    let stairwellPostId: mongoose.Types.ObjectId | null = null;
    
    for (const p of palette) {
      const creatorUsername = creators[p.creatorIdx].username;
      const creatorId = userMap[creatorUsername];
      const imageUrl = u(p.imageId);
      const cloudinaryId = `unsplash_${p.imageId}`;
      const caption = p.caption ? `${p.title} — ${p.caption}` : p.title;

      // Check if post already exists
      let post = await Post.findOne({ cloudinaryId });
      
      if (!post) {
        post = await Post.create({
          user: creatorId,
          imageUrl,
          cloudinaryId,
          caption,
          tags: p.tags,
          commentsCount: 0,
        });
        console.log(`Created post: "${p.title}" by @${creatorUsername}`);
      } else {
        post.user = creatorId;
        post.imageUrl = imageUrl;
        post.caption = caption;
        post.tags = p.tags;
        await post.save();
        console.log(`Updated post: "${p.title}"`);
      }

      if (p.title === 'Stairwell No. 4') {
        stairwellPostId = post._id as mongoose.Types.ObjectId;
      }
    }

    // 3. Seed comments for Stairwell No. 4
    if (stairwellPostId) {
      console.log('Seeding comments...');
      // Clear existing comments on this post to avoid duplication
      await Comment.deleteMany({ post: stairwellPostId });

      const commentData = [
        {
          post: stairwellPostId,
          user: userMap['ayanna.k'],
          text: 'The light on this is unreal.',
        },
        {
          post: stairwellPostId,
          user: userMap['juno.west'],
          text: 'Quietly powerful.',
        },
      ];

      await Comment.create(commentData);
      console.log('Comments seeded successfully.');

      // Update comment count
      await Post.findByIdAndUpdate(stairwellPostId, { commentsCount: 2 });
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();

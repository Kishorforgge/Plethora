import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  user: Types.ObjectId;
  imageUrl: string;
  cloudinaryId: string;
  caption: string;
  tags: string[];
  likes: Types.ObjectId[];
  commentsCount: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to a user'],
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Post must have an image URL'],
    },
    cloudinaryId: {
      type: String,
      required: [true, 'Post must have a Cloudinary ID'],
    },
    caption: {
      type: String,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: [
        'Architecture', 'Nature', 'Minimal', 'Interiors', 'Photography',
        'Texture', 'Mood', 'Editorial', 'Object', 'Pattern', 'Light', 'Gaming'
      ],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index tags for efficient search
PostSchema.index({ tags: 1 });
// Text index on caption and tags for full-text search features
PostSchema.index({ caption: 'text', tags: 'text' });

export const Post = model<IPost>('Post', PostSchema);

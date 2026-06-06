import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  bio: string;
  profilePicture: string;
  cloudinaryId?: string;
  googleId?: string;
  isVerified: boolean;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  bookmarks: Types.ObjectId[];
  blockedUsers: Types.ObjectId[];
  mutedUsers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: false,
      select: false, // Don't return password by default in queries
    },
    googleId: {
      type: String,
      default: '',
    },
    fullName: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png', // Fallback default avatar
    },
    cloudinaryId: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mutedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  // Since password might be unselected by default, check if it's loaded, otherwise we might need to fetch it explicitly
  if (!this.password) {
    throw new Error('Password field not selected. Ensure you select the password field from the database for verification.');
  }
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.index({ username: 'text' });

export const User = model<IUser>('User', UserSchema);

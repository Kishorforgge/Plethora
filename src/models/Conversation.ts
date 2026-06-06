import { Schema, model, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  title: string;
  participants: Types.ObjectId[];
  isPublic: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

export const Conversation = model<IConversation>('Conversation', ConversationSchema);

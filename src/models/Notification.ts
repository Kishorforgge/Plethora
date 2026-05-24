import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  type: 'like' | 'comment' | 'follow';
  post?: Types.ObjectId;
  comment?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a sender'],
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a receiver'],
      index: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow'],
      required: [true, 'Notification type is required'],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification>('Notification', NotificationSchema);

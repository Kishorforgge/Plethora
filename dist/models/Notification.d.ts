import { Document, Types } from 'mongoose';
export interface INotification extends Document {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    type: 'like' | 'comment' | 'follow' | 'new_post';
    post?: Types.ObjectId;
    comment?: Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Notification: import("mongoose").Model<INotification, {}, {}, {}, Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;

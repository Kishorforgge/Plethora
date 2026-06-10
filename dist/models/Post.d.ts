import { Document, Types } from 'mongoose';
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
export declare const Post: import("mongoose").Model<IPost, {}, {}, {}, Document<unknown, {}, IPost, {}, {}> & IPost & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;

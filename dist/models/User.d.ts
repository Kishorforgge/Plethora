import { Document, Types } from 'mongoose';
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
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;

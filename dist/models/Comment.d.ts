import { Document, Types } from 'mongoose';
export interface IComment extends Document {
    post: Types.ObjectId;
    user: Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Comment: import("mongoose").Model<IComment, {}, {}, {}, Document<unknown, {}, IComment, {}, {}> & IComment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;

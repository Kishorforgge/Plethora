import { Document, Types } from 'mongoose';
export interface IMessage extends Document {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    text: string;
    edited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Message: import("mongoose").Model<IMessage, {}, {}, {}, Document<unknown, {}, IMessage, {}, {}> & IMessage & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;

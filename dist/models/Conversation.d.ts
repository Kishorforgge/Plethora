import { Document, Types } from 'mongoose';
export interface IConversation extends Document {
    title: string;
    participants: Types.ObjectId[];
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Conversation: import("mongoose").Model<IConversation, {}, {}, {}, Document<unknown, {}, IConversation, {}, {}> & IConversation & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;

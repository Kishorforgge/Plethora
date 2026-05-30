"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    conversation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: [true, 'Message text is required'],
        trim: true,
        maxlength: 2000,
    },
}, { timestamps: true });
MessageSchema.index({ conversation: 1, createdAt: 1 });
exports.Message = (0, mongoose_1.model)('Message', MessageSchema);
//# sourceMappingURL=Message.js.map
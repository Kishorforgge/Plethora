"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
const mongoose_1 = require("mongoose");
const ConversationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        default: '',
        trim: true,
        maxlength: 120,
    },
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
exports.Conversation = (0, mongoose_1.model)('Conversation', ConversationSchema);
//# sourceMappingURL=Conversation.js.map
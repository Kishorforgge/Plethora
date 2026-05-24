"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Comment must be linked to a post'],
        index: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment must belong to a user'],
    },
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
        maxlength: [1000, 'Comment text cannot exceed 1000 characters'],
    },
}, {
    timestamps: true,
});
exports.Comment = (0, mongoose_1.model)('Comment', CommentSchema);
//# sourceMappingURL=Comment.js.map
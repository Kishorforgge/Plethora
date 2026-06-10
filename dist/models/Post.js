"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const mongoose_1 = require("mongoose");
const PostSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Post must belong to a user'],
        index: true,
    },
    imageUrl: {
        type: String,
        required: [true, 'Post must have an image URL'],
    },
    cloudinaryId: {
        type: String,
        required: [true, 'Post must have a Cloudinary ID'],
    },
    caption: {
        type: String,
        default: '',
    },
    tags: [
        {
            type: String,
            trim: true,
            lowercase: true,
        },
    ],
    likes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    commentsCount: {
        type: Number,
        default: 0,
    },
    category: {
        type: String,
        enum: [
            'Architecture', 'Nature', 'Minimal', 'Interiors', 'Photography',
            'Texture', 'Mood', 'Editorial', 'Object', 'Pattern', 'Light', 'Gaming'
        ],
        required: false,
    },
}, {
    timestamps: true,
});
// Index tags for efficient search
PostSchema.index({ tags: 1 });
// Text index on caption and tags for full-text search features
PostSchema.index({ caption: 'text', tags: 'text' });
exports.Post = (0, mongoose_1.model)('Post', PostSchema);
//# sourceMappingURL=Post.js.map
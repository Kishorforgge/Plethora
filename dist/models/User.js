"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    password: {
        type: String,
        required: false,
        select: false, // Don't return password by default in queries
    },
    googleId: {
        type: String,
        default: '',
    },
    fullName: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    profilePicture: {
        type: String,
        default: 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png', // Fallback default avatar
    },
    cloudinaryId: {
        type: String,
        default: '',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    followers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    following: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    bookmarks: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Post',
        },
    ],
    blockedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    mutedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
}, {
    timestamps: true,
});
// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password || '', salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    // Since password might be unselected by default, check if it's loaded, otherwise we might need to fetch it explicitly
    if (!this.password) {
        throw new Error('Password field not selected. Ensure you select the password field from the database for verification.');
    }
    return bcryptjs_1.default.compare(enteredPassword, this.password);
};
UserSchema.index({ username: 'text' });
exports.User = (0, mongoose_1.model)('User', UserSchema);
//# sourceMappingURL=User.js.map
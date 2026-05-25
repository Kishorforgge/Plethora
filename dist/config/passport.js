"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = require("../models/User");
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.User.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: '/api/auth/google/callback',
    proxy: true,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. Check if user already exists with this googleId
        let user = await User_1.User.findOne({ googleId: profile.id });
        if (user) {
            return done(null, user);
        }
        // 2. If not, check if a user with the same email exists
        const email = profile.emails?.[0]?.value;
        if (email) {
            user = await User_1.User.findOne({ email: email.toLowerCase() });
            if (user) {
                // Link googleId to existing account
                user.googleId = profile.id;
                await user.save();
                return done(null, user);
            }
        }
        // 3. Create a new user if one doesn't exist
        let username = (profile.displayName || '').replace(/\s+/g, '').toLowerCase();
        if (!username) {
            username = `googleuser${profile.id.substring(0, 6)}`;
        }
        // Ensure username is unique
        let usernameExists = await User_1.User.findOne({ username });
        if (usernameExists) {
            username = `${username}${Math.floor(Math.random() * 10000)}`;
        }
        user = await User_1.User.create({
            username,
            email: email ? email.toLowerCase() : `${profile.id}@google.placeholder.com`,
            fullName: profile.displayName || '',
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value || 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png',
            bio: '',
            followers: [],
            following: [],
            bookmarks: [],
        });
        return done(null, user);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
//# sourceMappingURL=passport.js.map
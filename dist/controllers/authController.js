"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const User_1 = require("../models/User");
const generateToken_1 = require("../utils/generateToken");
/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
    const { username, email, password, fullName } = req.body;
    try {
        // Check if user email or username already exists
        const userExists = await User_1.User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
        });
        if (userExists) {
            res.status(400);
            return next(new Error('User already exists with that email or username.'));
        }
        const user = await User_1.User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            fullName: fullName || '',
        });
        if (user) {
            res.status(201).json({
                status: 'success',
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    bio: user.bio,
                    profilePicture: user.profilePicture,
                    followersCount: user.followers.length,
                    followingCount: user.following.length,
                    token: (0, generateToken_1.generateToken)(user._id.toString()),
                },
            });
        }
        else {
            res.status(400);
            next(new Error('Invalid user data provided.'));
        }
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        // Find user and explicitly select password field
        const user = await User_1.User.findOne({ email: email.toLowerCase() }).select('+password');
        if (user && (await user.matchPassword(password))) {
            res.status(200).json({
                status: 'success',
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    bio: user.bio,
                    profilePicture: user.profilePicture,
                    followersCount: user.followers.length,
                    followingCount: user.following.length,
                    token: (0, generateToken_1.generateToken)(user._id.toString()),
                },
            });
        }
        else {
            res.status(401);
            next(new Error('Invalid email or password.'));
        }
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
/**
 * @desc    Logout user (stateless JWT, send success response)
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Successfully logged out. Please clear your token from storage.',
    });
};
exports.logoutUser = logoutUser;
/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized.'));
        }
        res.status(200).json({
            status: 'success',
            data: {
                _id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                fullName: req.user.fullName,
                bio: req.user.bio,
                profilePicture: req.user.profilePicture,
                followersCount: req.user.followers.length,
                followingCount: req.user.following.length,
                bookmarks: req.user.bookmarks,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
//# sourceMappingURL=authController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="./types/express/index.d.ts" />
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
require("./config/passport");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const discussionRoutes_1 = __importDefault(require("./routes/discussionRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const dns_1 = __importDefault(require("dns"));
dns_1.default.setDefaultResultOrder("ipv4first");
dotenv_1.default.config();
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
const clientUrl = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;
console.log("================ Backend Initialization ================");
console.log("Environment CLIENT_URL =", process.env.CLIENT_URL);
console.log("Normalized clientUrl =", clientUrl);
console.log("GOOGLE_CALLBACK_URL =", process.env.GOOGLE_CALLBACK_URL);
console.log("========================================================");
const app = (0, express_1.default)();
// Configure CORS
const allowedOrigins = [
    clientUrl,
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        const isAllowed = allowedOrigins.some(o => {
            const normalizedO = o.endsWith('/') ? o.slice(0, -1) : o;
            return normalizedO.toLowerCase() === normalizedOrigin.toLowerCase();
        });
        if (isAllowed) {
            callback(null, true);
        }
        else {
            console.warn(`[CORS Blocked] Origin: ${origin} is not allowed. Allowed origins:`, allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Session Configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'plethora-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Plethora Backend API is running...' });
});
// Register API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/posts', postRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/discussions', discussionRoutes_1.default);
app.use('/api/messages', messageRoutes_1.default);
// Error Handling Middleware
app.use(errorMiddleware_1.notFound);
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map
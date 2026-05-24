"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoUri = process.env.MONGO_URI;
const connectDB = async () => {
    const uri = mongoUri || process.env.MONGO_URI;
    if (!uri) {
        console.error('Missing MONGO_URI');
        process.exit(1);
    }
    try {
        const conn = await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds for DNS/connection issues
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=db.js.map
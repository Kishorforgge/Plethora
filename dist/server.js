"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
dns_1.default.setDefaultResultOrder("ipv4first");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Connect database
        await (0, db_1.connectDB)();
        // Start server
        app_1.default.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
};
process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
});
startServer();
//# sourceMappingURL=server.js.map
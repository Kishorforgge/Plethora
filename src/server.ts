import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect database
    await connectDB();

    const server = http.createServer(app);

    // Get allowed origins matching app config
    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const clientUrl = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;
    const allowedOrigins = [
      clientUrl,
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Initialize Socket.IO
    initSocket(server, allowedOrigins);

    server.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"
        } mode on http://localhost:${PORT}`
      );
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the other server (or run: netstat -ano | findstr :${PORT}) or set a different PORT in .env`
        );
        process.exit(1);
      }
      throw err;
    });

  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err: Error) => {
  console.error(
    `Unhandled Rejection Error: ${err.message}`
  );
});

startServer();
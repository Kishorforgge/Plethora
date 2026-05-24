import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect database
    await connectDB();

    // Start server
    app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on http://localhost:${PORT}`
      );
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
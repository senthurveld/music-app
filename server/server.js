import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import searchRoutes from "./routes/search.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://musix-app.up.railway.app"],
    credentials: true,
  }),
);

app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies

app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/dist")));
  console.log("🚀 Production mode: Serving static files");

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
  });
}

// 
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    port: PORT
  });
});


// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message
  });
});

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🎵 MUSIC SERVER STARTED");
  console.log("=".repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`\n📡 API ENDPOINTS:`);
  console.log(`• Health: http://localhost:${PORT}/api/health`);
  console.log(`• Search: http://localhost:${PORT}/api/search?q=test`);
  console.log(`• Auth: http://localhost:${PORT}/api/auth/check-auth`);
  
  if (process.env.NODE_ENV === "production") {
    console.log("\n🏗️ Serving React build from: client/dist");
  }
  console.log("=".repeat(50) + "\n");
});
// 

app.listen(PORT, () => {
  connectDB();
  console.log("Server is running on port: ", PORT);
});

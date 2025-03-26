require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes"); // Import the auth route
const summaryRoutes = require("./routes/summaryRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const topicModellingRoutes = require("./routes/topicClusteringRoutes");
const sentimentRoutes = require("./routes/sentimentRoutes");
const hashtagRoutes = require("./routes/hashtagRoutes");
const demographicsRoutes = require("./routes/demographicsRoutes");
const advancedRoutes = require("./routes/advancedRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Updated CORS
// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes); // Mount the auth route
app.use("/api", summaryRoutes);
app.use("/api", analysisRoutes);
app.use("/api", topicModellingRoutes);
app.use("/api", sentimentRoutes);
app.use("/api", hashtagRoutes);
app.use("/api", demographicsRoutes);
app.use("/api", advancedRoutes);




// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global error handler:", err);
  res.status(500).json({ error: "Server error" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

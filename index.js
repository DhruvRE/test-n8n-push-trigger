// index.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Service is running" });
});

// Default endpoint
app.get("/", (req, res) => {
  res.send("Hello! Your service is up and running.");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

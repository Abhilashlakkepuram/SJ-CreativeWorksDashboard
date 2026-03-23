const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://sj-creative-works-dashboard.vercel.app"
];

// ✅ CORS for Express
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// ✅ Your existing routes (UNCHANGED)
app.use("/api/auth", require("./routes/authRoutes"));
// add other routes if needed

// ✅ Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// ✅ Socket events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Example event
  socket.on("send_message", (data) => {
    console.log("Message:", data);

    // broadcast to all users
    io.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ START SERVER (IMPORTANT CHANGE)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// 1. Initialize Express App
const app = express();

// 2. Create HTTP Server for Socket.IO
const server = http.createServer(app);

// CORS configuration shared by Express and Socket.IO
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://sj-creative-works-dashboard.vercel.app",
    "https://sjcreativeworks.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
};

// 3. Initialize Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// Store io in app locals so controllers can use req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected to socket:", socket.id);

  // Users join a room named after their userId to receive targeted notifications
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room: user_${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

console.log("Starting SJ Creative Works Server...");

// 4. Connect to Database
connectDB();

// 5. Middleware
app.use(cors(corsOptions));
app.use(express.json());

// 6. Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("SJ Creative Works API Running");
});

// 7. Start Server using `server.listen` (NOT app.listen so that Socket.IO works)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// require("dotenv").config();

// const connectDB = require("./config/db");
// const authRoutes = require("./routes/authRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
// const leaveRoutes = require("./routes/leaveRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");

// const app = express();
// const server = http.createServer(app);

// // ✅ CORS FIX
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:5174",
//   "https://sj-creative-works-dashboard.vercel.app"
// ];

// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true
// }));

// // Extra safety headers
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "*");
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//   next();
// });

// // ✅ SOCKET FIX
// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

// app.set("io", io);

// io.on("connection", (socket) => {
//   console.log("Socket connected:", socket.id);

//   socket.on("join", (userId) => {
//     if (userId) {
//       socket.join(`user_${userId}`);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Socket disconnected:", socket.id);
//   });
// });

// connectDB();

// app.use(express.json());

// // ✅ ROUTES
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/leaves", leaveRoutes);
// app.use("/api/notifications", notificationRoutes);

// app.get("/", (req, res) => {
//   res.send("API Running...");
// });

// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

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
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const server = http.createServer(app);


// ✅ FINAL CORS (SUPPORTS VERCEL PREVIEW + LOCAL + PROD)
// ✅ FINAL CORS (SUPPORTS VERCEL PREVIEW + LOCAL + PROD)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://sj-creative-works-dashboard.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes(".vercel.app")) {
      return callback(null, true);
    }
    console.log("❌ CORS BLOCKED:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Explicitly allow methods
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"] // Explicitly allow headers
};

app.use(cors(corsOptions));

// ✅ Use a Native JS RegExp. This bypasses the string parser entirely!
app.options(/.*/, cors(corsOptions));


// ✅ SOCKET.IO (MATCH SAME LOGIC)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.includes(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Socket CORS blocked"), false);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("io", io);


// ✅ SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join", (userData) => {
    // Support both old clients (string userId) and new clients ({ userId, role })
    const userId = typeof userData === "string" ? userData : userData?.userId;
    const role = userData?.role;

    if (userId) {
      socket.join(`user_${userId}`);
    }
    if (role) {
      socket.join(`role_${role}`);
    }
  });

  socket.on("send-message", async (data) => {
    const { senderId, receiverId, roleReceiver, message, isGroupMessage } = data;
    const Message = require("./models/Message");

    const newMessage = await Message.create({
      sender: senderId,
      receiver: isGroupMessage ? undefined : receiverId,
      roleReceiver: isGroupMessage ? roleReceiver : undefined,
      isGroupMessage: !!isGroupMessage,
      message
    });

    if (isGroupMessage && roleReceiver) {
      // ✅ Emit to everyone in the role room, including sender
      io.to(`role_${roleReceiver}`).emit("new-message", newMessage);
    } else if (receiverId) {
      // ✅ Emit to individual receiver
      io.to(`user_${receiverId}`).emit("new-message", newMessage);
      // ✅ Emit to sender (for UI update)
      io.to(`user_${senderId}`).emit("new-message", newMessage);

      // 🔔 CREATE GLOBAL NOTIFICATION FOR RECEIVER
      try {
        const User = require("./models/User");
        const Notification = require("./models/Notification");

        const sender = await User.findById(senderId).select("name");
        const senderName = sender ? sender.name : "A colleague";

        const newNotification = await Notification.create({
          user: receiverId,
          type: "chat",
          message: `New chat message from ${senderName}`
        });

        // Trigger the red bubble on the receiver's bell icon
        io.to(`user_${receiverId}`).emit("new-notification", newNotification);
      } catch (err) {
        console.error("Failed to create chat notification:", err);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});


// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ DB
connectDB();


// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
// ✅ TEST ROUTE
app.get("/test", (req, res) => {
  res.send("API Running 🚀");
});


// ✅ ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);
  res.status(500).json({ message: err.message || "Server Error" });
});


// ✅ START SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
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
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const server = http.createServer(app);


// ✅ FINAL CORS (SUPPORTS VERCEL PREVIEW + LOCAL + PROD)
// ✅ FINAL CORS (SUPPORTS VERCEL PREVIEW + LOCAL + PROD)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
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
    const { senderId, receiverId, roleReceiver, message, isGroupMessage, fileUrl, fileType, fileName } = data;
    const Message = require("./models/Message");

    const newMessage = await Message.create({
      sender: senderId,
      receiver: isGroupMessage ? undefined : receiverId,
      roleReceiver: isGroupMessage ? roleReceiver : undefined,
      isGroupMessage: !!isGroupMessage,
      message,
      fileUrl,
      fileType,
      fileName
    });

    if (isGroupMessage && roleReceiver) {
      // ✅ Emit to everyone in the role room
      io.to(`role_${roleReceiver}`).emit("new-message", newMessage);
      // ✅ Emit to sender specifically
      io.to(`user_${senderId}`).emit("new-message", newMessage);

      // 🔔 CREATE GLOBAL NOTIFICATIONS FOR ALL IN ROLE
      try {
        const User = require("./models/User");
        const Notification = require("./models/Notification");

        const sender = await User.findById(senderId).select("name");
        const senderName = sender ? sender.name : "A colleague";

        // Find all users in this role (except sender)
        const targetUsers = await User.find({ role: roleReceiver, _id: { $ne: senderId } }).select("_id");

        if (targetUsers.length > 0) {
          const notifications = targetUsers.map(u => ({
            user: u._id,
            type: "chat",
            message: `New chat message in #${roleReceiver} from ${senderName}`
          }));

          // Bulk create notifications for efficiency
          const savedNotifs = await Notification.insertMany(notifications);

          // Emit to each user's private room
          savedNotifs.forEach(notif => {
            io.to(`user_${notif.user}`).emit("new-notification", notif);
          });
        }
      } catch (err) {
        console.error("Failed to create role chat notifications:", err);
      }
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

  socket.on("mark-seen", async (data) => {
    const { senderId, receiverId } = data; // receiverId is the one who "saw" the messages (current user)
    const Message = require("./models/Message");

    try {
      await Message.updateMany(
        { sender: senderId, receiver: receiverId, isSeen: false },
        { $set: { isSeen: true } }
      );
      
      // Notify the original sender that their messages were seen
      io.to(`user_${senderId}`).emit("messages-seen", { seenBy: receiverId });
    } catch (err) {
      console.error("Failed to mark messages as seen:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});


// ✅ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));


// ✅ DB
connectDB();


// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/holidays", require("./routes/holidayRoutes"));
app.use("/api/upload", uploadRoutes);
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
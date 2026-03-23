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
const app = express();
const server = http.createServer(app);

// ✅ FINAL CORS FIX (DYNAMIC ORIGIN)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://sj-creative-works-dashboard.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman, mobile apps

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};

// ✅ USE THIS ONLY (REMOVE YOUR OLD HEADERS CODE)
app.use(cors(corsOptions));

// ✅ PREFLIGHT FIX
// In Express 5 (path-to-regexp v8), unnamed wildcards like "*" throw an error.
// app.use(cors()) already handles preflight requests globally, so this line is redundant and can be removed:
// app.options("*", cors(corsOptions));

// ✅ SOCKET FIX
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ✅ MIDDLEWARE
app.use(express.json());

// ✅ DB
connectDB();

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ TEST
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
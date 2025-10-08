const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const Room = require("./models/Room");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// REST API
const roomRoutes = require("./routes/rooms");
app.use("/api/rooms", roomRoutes);

// Memory Maps
const roomUsers = new Map();     // roomId -> Set(socket.id)
const socketToRoom = new Map();  // socket.id -> roomId

// Socket.IO Setup
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);

    // Track users per room
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId).add(socket.id);
    const userCount = roomUsers.get(roomId).size;
    io.to(roomId).emit("user-count", userCount);
    console.log(`✅ ${socket.id} joined room ${roomId} → count: ${userCount}`);

    // Load existing drawing data
    try {
      const room = await Room.findOne({ roomId });
      if (room && room.drawingData) {
        socket.emit("load-drawing", room.drawingData);
      }
    } catch (err) {
      console.error("❌ Failed to fetch room data:", err);
    }
  });

  socket.on("draw-move", ({ path, color, width }) => {
    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit("draw-move", { path, color, width });
    }
  });

  socket.on("draw-end", async ({ path, color, width }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    const stroke = {
      type: "stroke",
      data: {
        path,
        color,
        width,
      },
      timestamp: new Date(),
    };

    try {
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({ roomId, createdAt: new Date(), lastActivity: new Date(), drawingData: [stroke] });
      } else {
        room.drawingData.push(stroke);
        room.lastActivity = new Date();
      }
      await room.save();
    } catch (err) {
      console.error("❌ Failed to save stroke to DB:", err);
    }
  });

  socket.on("clear-canvas", async () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    io.to(roomId).emit("clear-canvas");

    const clearCmd = {
      type: "clear",
      data: {},
      timestamp: new Date(),
    };

    try {
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({ roomId, createdAt: new Date(), lastActivity: new Date(), drawingData: [clearCmd] });
      } else {
        room.drawingData.push(clearCmd);
        room.lastActivity = new Date();
      }
      await room.save();
    } catch (err) {
      console.error("❌ Failed to save clear-canvas to DB:", err);
    }
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom.get(socket.id);
    if (roomId && roomUsers.has(roomId)) {
      const usersSet = roomUsers.get(roomId);
      usersSet.delete(socket.id);
      socketToRoom.delete(socket.id);

      const userCount = usersSet.size;
      if (userCount === 0) {
        roomUsers.delete(roomId);
      } else {
        io.to(roomId).emit("user-count", userCount);
      }

      console.log(`❌ ${socket.id} disconnected from ${roomId} → count: ${userCount}`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

// Express setup
const app = express();
app.use(express.json());
app.use(cors());

// Serve FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// Create HTTP server
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
    cors: { origin: "*" }
});

// -------------------------------
// ROOM MEMORY
// -------------------------------
let rooms = {};


// API: Create Room
app.post("/create-room", (req, res) => {
    const { room } = req.body;
    if (!room) return res.status(400).json({ error: "Room code required" });

    rooms[room] = { created: Date.now() };
    console.log("Room created:", room);

    res.json({ success: true, room });
});


// API: Validate Room
app.get("/validate-room/:code", (req, res) => {
    const code = req.params.code;
    res.json({ valid: !!rooms[code] });
});


// API: Log User Entry
app.post("/log", (req, res) => {
    console.log("User Log:", req.body);
    res.json({ success: true });
});


// SOCKET.IO — SYNC SYSTEM
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`${socket.id} joined room ${room}`);
    });

    socket.on("send-action", (data) => {
        io.to(data.room).emit("receive-action", data);
    });

    socket.on("chat-message", (data) => {
        io.to(data.room).emit("chat-message", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


// SPA fallback (important)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));
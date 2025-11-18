const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ---------------------------
// EXPRESS + SOCKET.IO SETUP
// ---------------------------
const app = express();
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

// --------------------------------
// TEMPORARY MEMORY ROOM DATABASE
// --------------------------------
let rooms = {}; // { roomCode: { created: timestamp } }


// --------------------------------------------------
// API 1 — CREATE ROOM
// --------------------------------------------------
app.post("/create-room", (req, res) => {
    const { room } = req.body;

    if (!room) {
        return res.status(400).json({ error: "Room code required" });
    }

    rooms[room] = { created: Date.now() };

    console.log("Room created:", room);

    return res.json({ success: true, room });
});


// --------------------------------------------------
// API 2 — VALIDATE ROOM
// --------------------------------------------------
app.get("/validate-room/:code", (req, res) => {
    const code = req.params.code;

    if (rooms[code]) {
        return res.json({ valid: true });
    } else {
        return res.json({ valid: false });
    }
});


// --------------------------------------------------
// API 3 — LOG USER
// --------------------------------------------------
app.post("/log", (req, res) => {
    console.log("User Log:", req.body);
    return res.json({ success: true });
});


// --------------------------------------------------
// SOCKET.IO — SYNC ACTIONS
// --------------------------------------------------
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("send-action", (data) => {
        io.to(data.room).emit("receive-action", data);
        console.log("Action sent:", data);
    });

    socket.on("chat-message", (data) => {
        io.to(data.room).emit("chat-message", data);
        console.log("Chat:", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


// --------------------------------------------------
// START SERVER
// --------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Backend running on port", PORT);
});
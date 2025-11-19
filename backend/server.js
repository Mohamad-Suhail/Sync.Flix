const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));


// ========= ROOM STORAGE ========= //
let rooms = {};  
// rooms = {
//   "ABC123": { users: [] }
// }


// ========== CREATE ROOM ========== //
app.post("/create-room", (req, res) => {
    const room = req.body.room;

    if (!room) {
        return res.status(400).json({ success: false, message: "Room required" });
    }

    rooms[room] = { users: [] };

    console.log("Room created:", room);
    res.json({ success: true, room });
});


// ========== JOIN ROOM ========== //
app.post("/join-room", (req, res) => {
    const room = req.body.room;
    const username = req.body.username;

    if (!room || !username) {
        return res.status(400).json({ success: false });
    }

    if (!rooms[room]) {
        return res.status(404).json({ success: false, message: "Room not found" });
    }

    rooms[room].users.push(username);
    console.log(`${username} joined room: ${room}`);

    res.json({ success: true });
});


// ========== VALIDATE ROOM ========== //
app.get("/validate-room/:code", (req, res) => {
    const code = req.params.code;
    res.json({ valid: !!rooms[code] });
});


// ========== LOG USERS ========== //
app.post("/log", (req, res) => {
    console.log("Login Log → ", req.body);
    res.json({ success: true });
});


// ========== SOCKET.IO SYNC ========== //
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins room
    socket.on("join-room", ({ room, username }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;

        console.log(`${username} joined room ${room}`);

        // Broadcast participant join
        io.to(room).emit("user-joined", {
            username,
            id: socket.id
        });
    });

    // Real-time chat
    socket.on("chat-message", (data) => {
        io.to(data.room).emit("chat-message", {
            username: data.username,
            message: data.message,
            time: Date.now()
        });
    });

    // Emoji reaction broadcast
    socket.on("emoji", (data) => {
        io.to(data.room).emit("emoji", {
            username: data.username,
            emoji: data.emoji
        });
    });

    // Disconnect Handling
    socket.on("disconnect", () => {
        if (socket.room && socket.username) {
            io.to(socket.room).emit("user-left", {
                username: socket.username,
                id: socket.id
            });
        }
        console.log("User disconnected:", socket.id);
    });
});


// ========== FALLBACK TO FRONTEND ========== //
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});


// ========== START SERVER ========== //
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));
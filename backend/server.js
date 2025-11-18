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


// ========== FALLBACK TO FRONTEND ========== //
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});


// ========== START SERVER ========== //
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));
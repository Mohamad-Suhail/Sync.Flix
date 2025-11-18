import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let activeRooms = {}; // Stores created rooms


// =========================
// CREATE ROOM (HOST)
// =========================
app.post("/create-room", (req, res) => {
    const username = req.body.username;

    const room = Math.random().toString(36).substring(2, 8).toUpperCase();
    activeRooms[room] = { host: username, users: [username] };

    logUser(username, room, "host");

    res.json({ success: true, room, role: "host" });
});


// =========================
// JOIN ROOM (PARTICIPANT)
// =========================
app.post("/join-room", (req, res) => {
    const { username, roomCode } = req.body;

    if (!activeRooms[roomCode]) {
        return res.json({ success: false, msg: "Invalid room" });
    }

    activeRooms[roomCode].users.push(username);

    logUser(username, roomCode, "participant");

    res.json({ success: true, role: "participant" });
});


// =========================
// LOG FILE
// =========================
function logUser(user, room, role) {
    const entry = `${new Date().toISOString()} - ${user} joined room ${room} as ${role}\n`;
    fs.appendFileSync("logs.txt", entry);
}


// =========================
// SOCKET.IO REALTIME SYNC
// =========================
io.on("connection", socket => {
    console.log("User connected");

    socket.on("join-room", ({ room, name }) => {
        socket.join(room);
        socket.to(room).emit("user-joined", name);
    });

    socket.on("send-message", data => {
        io.to(data.room).emit("receive-message", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});


// =========================
// START SERVER
// =========================
server.listen(3000, () => console.log("Server running on port 3000"));
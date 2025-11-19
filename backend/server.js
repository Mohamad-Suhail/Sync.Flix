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

// Serve frontend (adjust if your public/docs folder differs)
app.use(express.static(path.join(__dirname, "public")));

// ========= ROOM STORAGE ========= //
// rooms structure:
// rooms = {
//   "ROOMCODE": {
//      users: [{ username, socketId }, ...],
//      sockets: [socketId, ...],
//      messages: [{ id, username, text, time, deliveredBy: [], seenBy: [] }, ...]
//   }
// }
let rooms = {};

// ========== CREATE ROOM ========== //
app.post("/create-room", (req, res) => {
    // accept optional room code from client (or server can generate)
    const room = req.body.room || (Math.random().toString(36).substring(2, 8).toUpperCase());
    if (!room) return res.status(400).json({ success: false, message: "Room required" });

    if (!rooms[room]) {
        rooms[room] = { users: [], sockets: [], messages: [] };
    }

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

    // Note: actual socket join is handled via Socket.IO connection
    // we still keep a list of known usernames (optional)
    rooms[room].users.push({ username });
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

    // handle join-room (from client)
    socket.on("join-room", ({ room, username }) => {
        if (!room) return;
        socket.join(room);
        socket.room = room;
        socket.username = username;

        // initialize room if missing
        if (!rooms[room]) rooms[room] = { users: [], sockets: [], messages: [] };

        // track socket
        if (!rooms[room].sockets.includes(socket.id)) rooms[room].sockets.push(socket.id);

        console.log(`${username} (${socket.id}) joined room ${room}`);

        // notify other users
        io.to(room).emit("user-joined", { username, id: socket.id });

        // send current message history (optional)
        socket.emit("message-history", rooms[room].messages);
    });

    // receive chat message from a client
    // expected data: { room, username, message, id (clientId) , time (optional) }
    socket.on("chat-message", (data) => {
        if (!data || !data.room) return;
        const room = data.room;
        const messageId = data.id || (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
        const time = data.time || Date.now();

        const msgObj = {
            id: messageId,
            username: data.username || socket.username || "Unknown",
            text: data.message,
            time,
            deliveredBy: [], // socket ids which have ACKed 'message-received'
            seenBy: []       // socket ids which have marked message as seen
        };

        // store message
        if (!rooms[room]) rooms[room] = { users: [], sockets: [], messages: [] };
        rooms[room].messages.push(msgObj);

        // broadcast new message to room
        io.to(room).emit("new-message", msgObj);
    });

    // client acknowledges it received a message (delivered status from that client)
    // data: { room, messageId }
    socket.on("message-received", (data) => {
        if (!data || !data.room || !data.messageId) return;
        const room = data.room;
        const messageId = data.messageId;

        const roomObj = rooms[room];
        if (!roomObj) return;

        const msg = roomObj.messages.find(m => m.id === messageId);
        if (!msg) return;

        if (!msg.deliveredBy.includes(socket.id)) {
            msg.deliveredBy.push(socket.id);
        }

        // Check if message is delivered to all connected sockets in room
        const totalSockets = roomObj.sockets.length || 0;
        if (msg.deliveredBy.length >= totalSockets && totalSockets > 0) {
            // Notify room that message is delivered
            io.to(room).emit("message-delivered", { messageId });
        }
    });

    // client marks message as seen (data: { room, messageId })
    socket.on("message-seen", (data) => {
        if (!data || !data.room || !data.messageId) return;
        const room = data.room;
        const messageId = data.messageId;

        const roomObj = rooms[room];
        if (!roomObj) return;

        const msg = roomObj.messages.find(m => m.id === messageId);
        if (!msg) return;

        if (!msg.seenBy.includes(socket.id)) {
            msg.seenBy.push(socket.id);
        }

        // Broadcast seen update (include who saw it)
        io.to(room).emit("message-seen", { messageId, seenBy: msg.seenBy.slice() });
    });

    // emoji broadcast
    // data: { room, username, emoji }
    socket.on("emoji", (data) => {
        if (!data || !data.room) return;
        io.to(data.room).emit("emoji", {
            username: data.username || socket.username,
            emoji: data.emoji
        });
    });

    // cleanup on disconnect
    socket.on("disconnect", () => {
        const room = socket.room;
        if (room && rooms[room]) {
            // remove socket id
            rooms[room].sockets = rooms[room].sockets.filter(sid => sid !== socket.id);

            // optionally notify others
            io.to(room).emit("user-left", { username: socket.username, id: socket.id });

            // (Optional) If room becomes empty, you may remove it after some TTL
            if (rooms[room].sockets.length === 0) {
                // keep room data for now or delete:
                // delete rooms[room];
                console.log(`Room ${room} empty (kept messages)`);
            }
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
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// USER CONNECTED
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("send-action", (data) => {
        io.to(data.room).emit("receive-action", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Backend running on PORT", PORT);
});
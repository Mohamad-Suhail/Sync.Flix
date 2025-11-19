// server.js (FULL - replace your current server.js)
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
app.use(express.static(path.join(__dirname, "public")));

// rooms structure:
// rooms = {
//   ROOMCODE: {
//     sockets: [socketId,...],
//     messages: [...], // optional
//     video: { videoId, playing (bool), currentTime (seconds), lastUpdate (Date.now()) }
//   }
// }
let rooms = {};

// simple helper to ensure room exists
function ensureRoom(code) {
  if (!rooms[code]) rooms[code] = { sockets: [], messages: [], video: null };
  return rooms[code];
}

// create-room endpoint (optional)
app.post("/create-room", (req, res) => {
  const room = req.body.room || (Math.random().toString(36).substring(2, 8).toUpperCase());
  ensureRoom(room);
  res.json({ success: true, room });
});

// other endpoints (validate/join/log) remain similar if needed
app.post("/join-room", (req, res) => {
  const room = req.body.room;
  const username = req.body.username;
  if (!room || !username) return res.status(400).json({ success: false });
  ensureRoom(room);
  res.json({ success: true });
});

app.get("/validate-room/:code", (req, res) => {
  res.json({ valid: !!rooms[req.params.code] });
});

// SOCKET.IO
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // client joins room (called when loading room)
  // payload: { room, username }
  socket.on("join-room", ({ room, username }) => {
    if (!room) return;
    socket.join(room);
    socket.room = room;
    socket.username = username || "Guest";

    const r = ensureRoom(room);
    if (!r.sockets.includes(socket.id)) r.sockets.push(socket.id);

    // notify others
    socket.to(room).emit("user-joined", { username: socket.username, id: socket.id });

    // send current video state to this socket so they can load same video
    if (r.video) {
      // send the server-side stored video state
      socket.emit("room-video-state", r.video);
    }

    // (optional) send message history
    if (Array.isArray(r.messages)) {
      socket.emit("message-history", r.messages);
    }

    console.log(`${socket.username} (${socket.id}) joined ${room}`);
  });

  // NEW: load a video (user clicked a video)
  // payload: { room, videoId, currentTime, clientTime }
  socket.on("load-video", (data) => {
    if (!data || !data.room) return;
    const room = data.room;
    const videoId = data.videoId;
    const now = Date.now();

    ensureRoom(room).video = {
      videoId,
      playing: false,
      currentTime: data.currentTime || 0,
      lastUpdate: now,
      lastClientTime: data.clientTime || now
    };

    // broadcast to all in room (including sender)
    io.to(room).emit("load-video", {
      videoId,
      currentTime: data.currentTime || 0,
      clientTime: data.clientTime || now
    });

    console.log(`load-video ${videoId} in room ${room} by ${socket.id}`);
  });

  // USER PLAY (payload: { room, currentTime, clientTime })
  socket.on("video-play", (data) => {
    if (!data || !data.room) return;
    const room = data.room;
    const now = Date.now();
    const r = ensureRoom(room);
    r.video = r.video || {};
    r.video.videoId = r.video.videoId || data.videoId || r.video.videoId;
    r.video.playing = true;
    r.video.currentTime = data.currentTime || 0;
    r.video.lastUpdate = now;
    r.video.lastClientTime = data.clientTime || now;

    // broadcast to others
    io.to(room).emit("video-play", {
      currentTime: data.currentTime || 0,
      clientTime: data.clientTime || now,
      origin: socket.id
    });
  });

  // USER PAUSE (payload: { room, currentTime, clientTime })
  socket.on("video-pause", (data) => {
    if (!data || !data.room) return;
    const room = data.room;
    const now = Date.now();
    const r = ensureRoom(room);
    r.video = r.video || {};
    r.video.playing = false;
    r.video.currentTime = data.currentTime || 0;
    r.video.lastUpdate = now;
    r.video.lastClientTime = data.clientTime || now;

    io.to(room).emit("video-pause", {
      currentTime: data.currentTime || 0,
      clientTime: data.clientTime || now,
      origin: socket.id
    });
  });

  // USER SEEK (payload: { room, seekTime, clientTime })
  socket.on("video-seek", (data) => {
    if (!data || !data.room) return;
    const room = data.room;
    const now = Date.now();
    const r = ensureRoom(room);
    r.video = r.video || {};
    r.video.currentTime = data.seekTime || 0;
    r.video.lastUpdate = now;
    r.video.lastClientTime = data.clientTime || now;

    io.to(room).emit("video-seek", {
      seekTime: data.seekTime,
      clientTime: data.clientTime || now,
      origin: socket.id
    });
  });

  // (optional) request current video state (client can ask on poor join)
  // socket.on("request-video-state", ({ room }) => {
  //   const r = ensureRoom(room);
  //   if (r.video) socket.emit("room-video-state", r.video);
  // });

  // other socket handlers you already have (chat, emoji, message receipts)...
  socket.on("chat-message", (data) => {
    if (!data || !data.room) return;
    const room = data.room;
    const msgId = data.id || (Date.now().toString(36) + Math.random().toString(36).slice(2,8));
    const msg = {
      id: msgId,
      username: data.username || socket.username || "Unknown",
      text: data.message,
      time: data.time || Date.now(),
      deliveredBy: [],
      seenBy: []
    };
    ensureRoom(room).messages.push(msg);
    io.to(room).emit("new-message", msg);
  });

  socket.on("message-received", (data) => {
    if (!data || !data.room) return;
    const room = data.room;
    const messageId = data.messageId;
    const r = ensureRoom(room);
    const m = r.messages.find(x => x.id === messageId);
    if (m && !m.deliveredBy.includes(socket.id)) {
      m.deliveredBy.push(socket.id);
    }
    // if delivered to all, notify
    if (m) {
      const total = r.sockets.length;
      if (m.deliveredBy.length >= total && total > 0) {
        io.to(room).emit("message-delivered", { messageId });
      }
    }
  });

  socket.on("message-seen", (data) => {
    if (!data || !data.room) return;
    const room = data.room;
    const messageId = data.messageId;
    const r = ensureRoom(room);
    const m = r.messages.find(x => x.id === messageId);
    if (m && !m.seenBy.includes(socket.id)) {
      m.seenBy.push(socket.id);
    }
    if (m) {
      io.to(room).emit("message-seen", { messageId, seenBy: m.seenBy.slice() });
    }
  });

  socket.on("emoji", (data) => {
    if (!data || !data.room) return;
    io.to(data.room).emit("emoji", {
      username: data.username || socket.username,
      emoji: data.emoji
    });
  });

  socket.on("disconnect", () => {
    // remove socket from room lists
    const room = socket.room;
    if (room && rooms[room]) {
      rooms[room].sockets = rooms[room].sockets.filter(sid => sid !== socket.id);
      io.to(room).emit("user-left", { username: socket.username, id: socket.id });
    }
    console.log("Socket disconnected:", socket.id);
  });

});

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));

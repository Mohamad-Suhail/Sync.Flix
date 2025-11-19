// room.js — FULL client: YouTube search + IFrame API + full timestamp sync + chat & emoji (socket.io)

// ================= URL params =================
function getQueryParam(key) { return new URLSearchParams(window.location.search).get(key); }
const username = getQueryParam("name") || "Guest";
const roomCode = getQueryParam("room") || "XXXXXX";
const service = getQueryParam("service") || "youtube";

document.getElementById("user-name").textContent = username;
document.getElementById("room-code-top").textContent = `Room: ${roomCode}`;

// ================= YouTube Data API KEY =================
// Get an API key: https://console.developers.google.com/
// Enable "YouTube Data API v3" for your project
const YT_API_KEY = "AIzaSyCEcbJWtOk4AAc6Cj787dE30WVmXGBze3M"; // <<-- REPLACE WITH YOUR KEY

// ================= Socket.IO =================
const socket = io("https://sync-flix.onrender.com");

// join room
socket.emit("join-room", { room: roomCode, username });

// ================= Elements =================
const mediaContainer = document.getElementById("media-container");
const playBtn = document.getElementById("play");
const pauseBtn = document.getElementById("pause");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const searchResults = document.getElementById("search-results");

// chat & emoji elements (simplified)
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-text");
const sendBtn = document.getElementById("send-btn");
const emojiBtns = document.querySelectorAll(".emoji-btn");
const chatPanel = document.getElementById("chat-panel");

// ================ YouTube Player via IFrame API =================
// We'll create global player variable YT expects
let player = null;
let playerReady = false;
let isSeeking = false; // to prevent responding to own seeks
let lastState = -1;

// create a small helper to initialize a blank player container
function createPlayerContainer() {
  mediaContainer.innerHTML = `<div id="yt-player"></div>`;
}

// function that YouTube API calls when ready
function onYouTubeIframeAPIReady() {
  // When first loading, no videoId; we'll create player with empty videoId
  if (!player) {
    player = new YT.Player("yt-player", {
      height: "350",
      width: "100%",
      videoId: "", // blank initially
      playerVars: { controls: 1, modestbranding: 1 },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }
}

// attach to global (YouTube API requires this name)
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function onPlayerReady(evt) {
  playerReady = true;
}

function onPlayerStateChange(event) {
  const state = event.data;
  // states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering
  // Avoid loops: when we received an incoming remote command and adjusted player, we should not re-emit identical action.
  // We'll emit events using explicit user UI actions instead of every state change.
  lastState = state;
}

// ================ Helpers: time & id =================
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function nowMs() { return Date.now(); }

// Sync: compute target time for receivers (accounts for latency)
function computeTargetTime(sentCurrentTime, sentClientTime) {
  const extra = (Date.now() - sentClientTime) / 1000; // seconds elapsed since sender sent
  return sentCurrentTime + extra;
}

// ================= Load video (local user clicked a result) =================
function userLoadVideo(videoId) {
  const currentTime = 0;
  const clientTime = nowMs();

  // Update local player immediately
  if (!player) {
    createPlayerContainer();
    // ensure YouTube API initializes if not yet
  }
  if (playerReady && player) {
    player.loadVideoById(videoId, 0);
  } else {
    // create or reset player to load once ready
    setTimeout(() => {
      if (playerReady && player) player.loadVideoById(videoId, 0);
    }, 400);
  }

  // emit to server to inform everyone (server stores state)
  socket.emit("load-video", { room: roomCode, videoId, currentTime, clientTime });
}

// ================= Receive load-video from server =================
socket.on("load-video", (data) => {
  // data: { videoId, currentTime, clientTime }
  createPlayerContainer();
  // If player exists and ready, load; else wait a bit
  const targetTime = computeTargetTime(data.currentTime || 0, data.clientTime || nowMs());
  const vid = data.videoId;

  function doLoad() {
    if (playerReady && player) {
      // load and seek to targetTime (small compensation)
      try {
        player.loadVideoById(vid, targetTime);
      } catch (e) {
        player.cueVideoById(vid, targetTime);
      }
    } else {
      setTimeout(doLoad, 200);
    }
  }
  doLoad();
});

// ================= Play / Pause / Seek (UI triggers) =================
// local user pressed Play
playBtn.addEventListener("click", () => {
  if (!player || !playerReady) return;
  const currentTime = player.getCurrentTime();
  const clientTime = nowMs();
  player.playVideo();
  socket.emit("video-play", { room: roomCode, currentTime, clientTime });
});

// local user pressed Pause
pauseBtn.addEventListener("click", () => {
  if (!player || !playerReady) return;
  const currentTime = player.getCurrentTime();
  const clientTime = nowMs();
  player.pauseVideo();
  socket.emit("video-pause", { room: roomCode, currentTime, clientTime });
});

// Seek controls: we provide prev/next to navigate search results or basic +/-10s
prevBtn.addEventListener("click", () => {
  if (!player || !playerReady) return;
  // Seek backward 10s
  const t = Math.max(0, player.getCurrentTime() - 10);
  player.seekTo(t, true);
  socket.emit("video-seek", { room: roomCode, seekTime: t, clientTime: nowMs() });
});

nextBtn.addEventListener("click", () => {
  if (!player || !playerReady) return;
  // Seek forward 10s
  const t = player.getCurrentTime() + 10;
  player.seekTo(t, true);
  socket.emit("video-seek", { room: roomCode, seekTime: t, clientTime: nowMs() });
});

// Also handle manual seeks (user drags progress). The Youtube IFrame API doesn't have direct "seek" events.
// We'll poll every 500ms to detect large jumps while playing or paused.
let lastPolledTime = 0;
setInterval(() => {
  if (!player || !playerReady) return;
  const t = player.getCurrentTime();
  if (Math.abs(t - lastPolledTime) > 1.2) { // user likely sought
    lastPolledTime = t;
    socket.emit("video-seek", { room: roomCode, seekTime: t, clientTime: nowMs() });
  } else {
    lastPolledTime = t;
  }
}, 700);

// ================= Receive play/pause/seek events from server =================
socket.on("video-play", (data) => {
  // data: { currentTime, clientTime, origin }
  if (!playerReady || !player) return;
  // compute target time with latency compensation
  const target = computeTargetTime(data.currentTime || 0, data.clientTime || nowMs());
  // seek then play
  try {
    player.seekTo(target, true);
  } catch (e) {}
  player.playVideo();
});

socket.on("video-pause", (data) => {
  if (!playerReady || !player) return;
  const target = computeTargetTime(data.currentTime || 0, data.clientTime || nowMs());
  try {
    player.seekTo(target, true);
  } catch (e) {}
  player.pauseVideo();
});

socket.on("video-seek", (data) => {
  if (!playerReady || !player) return;
  const target = computeTargetTime(data.seekTime || 0, data.clientTime || nowMs());
  try {
    player.seekTo(target, true);
  } catch (e) {}
});

// ================= On join, server may send current room-video-state =================
socket.on("room-video-state", (v) => {
  // v: { videoId, playing, currentTime, lastUpdate, lastClientTime }
  if (!v) return;
  createPlayerContainer();
  function doSync() {
    if (!playerReady || !player) { setTimeout(doSync, 200); return; }

    const target = computeTargetTime(v.currentTime || 0, v.lastClientTime || nowMs());
    if (v.videoId) {
      try {
        player.loadVideoById(v.videoId, target);
      } catch (e) {
        player.cueVideoById(v.videoId, target);
      }
      if (v.playing) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }
  doSync();
});

// ================= YouTube SEARCH (Data API) =================
async function searchYouTube(q) {
  if (!YT_API_KEY || YT_API_KEY === "YOUR_YOUTUBE_DATA_API_KEY") {
    alert("Please set your YouTube Data API key in room.js (YT_API_KEY). See instructions in the code.");
    return [];
  }
  const encoded = encodeURIComponent(q);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encoded}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data || !data.items) return [];
  // map results
  return data.items.map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumb: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
  }));
}

function renderSearchResults(results) {
  searchResults.innerHTML = "";
  if (!results.length) {
    searchResults.innerHTML = `<p style="opacity:.6;padding:8px">No results</p>`;
    return;
  }
  const grid = document.createElement("div");
  grid.className = "results-grid";
  results.forEach(r => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <img src="${r.thumb}" alt="${r.title}" />
      <div class="rmeta">
        <div class="rtitle">${r.title}</div>
        <button class="rplay" data-vid="${r.videoId}">Play</button>
      </div>
    `;
    grid.appendChild(card);
  });
  searchResults.appendChild(grid);

  // attach click handlers
  document.querySelectorAll(".rplay").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const vid = e.currentTarget.dataset.vid;
      userLoadVideo(vid);
    });
  });
}

// search button
searchBtn.addEventListener("click", async () => {
  const q = (searchInput.value || "").trim();
  if (!q) return;
  searchResults.innerHTML = `<p style="opacity:.6;padding:8px">Searching...</p>`;
  const results = await searchYouTube(q);
  renderSearchResults(results);
});

// Press Enter to search
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// ================= CHAT & EMOJI minimal logic (re-use earlier) =================
function addMessage(user, text, mine = false) {
  const div = document.createElement("div");
  div.className = "msg" + (mine ? " me" : "");
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${user} • ${new Date().toLocaleTimeString()}`;
  const txt = document.createElement("div");
  txt.textContent = text;
  div.appendChild(meta);
  div.appendChild(txt);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// send chat
sendBtn.addEventListener("click", () => {
  const text = (chatInput.value || "").trim();
  if (!text) return;
  const id = makeId();
  socket.emit("chat-message", { id, room: roomCode, username, message: text, time: Date.now() });
  addMessage(username, text, true);
  chatInput.value = "";
});
chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendBtn.click(); });

socket.on("new-message", (m) => { addMessage(m.username, m.text, m.username === username); });

// emojis
emojiBtns.forEach(b => b.addEventListener("click", () => {
  const emoji = b.innerText;
  socket.emit("emoji", { room: roomCode, username, emoji });
}));
socket.on("emoji", (d) => { addMessage(d.username, d.emoji, d.username === username); /* floating bubble optional */ });

// ================= small bootstrap: create player container if service youtube || music
if (service === "youtube" || service === "music") {
  createPlayerContainer();
  // if API already loaded, onYouTubeIframeAPIReady will be called automatically
}
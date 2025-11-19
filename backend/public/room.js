// =======================================
//  URL PARAMS
// =======================================
function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}

const username = getQueryParam("name") || "Guest";
const roomCode = getQueryParam("room") || "XXXXXX";
const service = getQueryParam("service") || "youtube";

document.getElementById("user-name").textContent = username;
document.getElementById("room-code-top").textContent = `Room: ${roomCode}`;


// =======================================
//  SOCKET.IO CONNECTION
// =======================================
const socket = io("https://sync-flix.onrender.com");

// Join room with username
socket.emit("join-room", {
    room: roomCode,
    username: username
});


// =======================================
//  LEFT MENU OPEN/CLOSE
// =======================================
const sideMenu = document.getElementById("side-menu");
const menuToggle = document.getElementById("menu-toggle");

menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sideMenu.classList.toggle("open");
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        sideMenu.classList.remove("open");
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") sideMenu.classList.remove("open");
});


// =======================================
//  APPEARANCE TOGGLE
// =======================================
const appearanceToggle = document.getElementById("appearance-toggle");

appearanceToggle.addEventListener("click", () => {
    appearanceToggle.classList.toggle("active");
    document.body.classList.toggle("light");
});


// =======================================
//  MEDIA PLAYER LOGIC
// =======================================
const mediaContainer = document.getElementById("media-container");

function loadSelectedService() {

    mediaContainer.innerHTML = ""; // reset

    // --- YouTube Player ---
    if (service === "youtube") {
        mediaContainer.innerHTML = `
            <iframe width="100%" height="350"
                src="https://www.youtube.com/embed/?controls=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                allowfullscreen>
            </iframe>`;
    }

    // --- YouTube Music (playlist trick) ---
    else if (service === "music") {
        mediaContainer.innerHTML = `
            <iframe width="100%" height="350"
                src="https://www.youtube.com/embed?list=RDCLAK5uy_kwfmMFDK7GdO81r0ZmIhgRNk_CXqQz0HI"
                frameborder="0" allowfullscreen>
            </iframe>`;
    }

    // --- Local file playback ---
    else if (service === "local") {
        mediaContainer.innerHTML = `
            <input id="fileInput" type="file" accept="video/*,audio/*">
            <video id="localVideo" width="100%" height="350" controls></video>
        `;

        const fileInput = document.getElementById("fileInput");
        const localVideo = document.getElementById("localVideo");

        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (file) localVideo.src = URL.createObjectURL(file);
        };
    }

    else {
        mediaContainer.innerHTML = "<p>Unsupported Service</p>";
    }
}

loadSelectedService();


// =======================================
//  MEDIA CONTROLS
// =======================================
document.getElementById("play").onclick = () => {
    document.querySelector("video")?.play();
};

document.getElementById("pause").onclick = () => {
    document.querySelector("video")?.pause();
};

document.getElementById("next").onclick = () => {
    alert("Next feature coming soon.");
};

document.getElementById("prev").onclick = () => {
    alert("Previous feature coming soon.");
};


// =======================================
//  REAL-TIME CHAT SYSTEM (Socket.IO)
// =======================================
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-text");
const sendBtn = document.getElementById("send-btn");

// Render message
function addMessage(user, text, mine = false) {
    const div = document.createElement("div");
    div.className = "msg" + (mine ? " me" : "");

    if (!mine) {
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = user;
        div.appendChild(meta);
    }

    const msg = document.createElement("div");
    msg.textContent = text;
    div.appendChild(msg);

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// SEND message (emit to server)
sendBtn.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text) return;

    socket.emit("chat-message", {
        room: roomCode,
        username: username,
        message: text
    });

    chatInput.value = "";
});

chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

// RECEIVE message
socket.on("chat-message", (data) => {
    addMessage(data.username, data.message, data.username === username);
});


// =======================================
//  REAL-TIME EMOJI SYNC (Socket.IO)
// =======================================
const emojiButtons = document.querySelectorAll(".emoji-btn");
const chatPanel = document.getElementById("chat-panel");

// Send emoji
emojiButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const emoji = btn.innerText;

        socket.emit("emoji", {
            room: roomCode,
            username: username,
            emoji: emoji
        });
    });
});

// Receive emoji + float animation
socket.on("emoji", (data) => {

    // Add in chat
    addMessage(data.username, data.emoji, data.username === username);

    // Floating animation
    const float = document.createElement("div");
    float.className = "floating-emoji";
    float.textContent = data.emoji;

    const rect = chatPanel.getBoundingClientRect();
    float.style.left = rect.left + rect.width / 2 + "px";
    float.style.top = rect.top + 20 + "px";

    document.body.appendChild(float);

    setTimeout(() => float.remove(), 1500);
});


// =======================================
//  USER JOIN / LEAVE NOTIFICATIONS
// =======================================
socket.on("user-joined", (data) => {
    addMessage("System", `${data.username} joined the room`);
});

socket.on("user-left", (data) => {
    addMessage("System", `${data.username} left the room`);
});


// =======================================
//  SEARCH BAR
// =======================================
document.getElementById("search-btn").addEventListener("click", () => {
    const q = document.getElementById("search-input").value.trim();
    if (!q) return;

    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, "_blank");
});
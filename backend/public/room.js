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

// utility for unique message id
function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

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
//  ELEMENTS
// =======================================
const sideMenu = document.getElementById("side-menu");
const menuToggle = document.getElementById("menu-toggle");
const appearanceToggle = document.getElementById("appearance-toggle");
const chatPanel = document.getElementById("chat-panel");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-text");
const sendBtn = document.getElementById("send-btn");
const emojiBtns = document.querySelectorAll(".emoji-btn");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const participantsBtn = document.getElementById("participants-btn");
const mediaContainer = document.getElementById("media-container");

// keep map of displayed messages to avoid duplicates
const displayed = new Map(); // messageId -> DOM element

// =======================================
//  Side menu open/close
// =======================================
menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sideMenu.classList.toggle("open");
});
document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        sideMenu.classList.remove("open");
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") sideMenu.classList.remove("open");
});

// appearance toggle
appearanceToggle.addEventListener("click", () => {
    appearanceToggle.classList.toggle("active");
    document.body.classList.toggle("light");
});

// =======================================
//  Load media (same as before)
// =======================================
function loadSelectedService() {
    mediaContainer.innerHTML = "";
    if (service === "youtube") {
        mediaContainer.innerHTML = `<iframe width="100%" height="350"
            src="https://www.youtube.com/embed/?controls=1"
            frameborder="0" allowfullscreen></iframe>`;
    } else if (service === "music") {
        mediaContainer.innerHTML = `<iframe width="100%" height="350"
            src="https://www.youtube.com/embed?list=RDCLAK5uy_kwfmMFDK7GdO81r0ZmIhgRNk_CXqQz0HI"
            frameborder="0" allowfullscreen></iframe>`;
    } else if (service === "local") {
        mediaContainer.innerHTML = `<input id="fileInput" type="file" accept="video/*,audio/*">
            <video id="localVideo" width="100%" height="350" controls></video>`;
        const fileInput = document.getElementById("fileInput");
        const localVideo = document.getElementById("localVideo");
        fileInput.onchange = () => {
            const f = fileInput.files[0];
            if (f) localVideo.src = URL.createObjectURL(f);
        };
    } else {
        mediaContainer.innerHTML = `<p>Unsupported service</p>`;
    }
}
loadSelectedService();

// =======================================
//  Message rendering helpers
// =======================================
function fmtTime(ts) {
    const d = new Date(ts);
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = ((hh + 11) % 12) + 1;
    return `${hh}:${mm} ${ampm}`;
}

function createMessageElement(msgObj, mine = false) {
    // msgObj: { id, username, text, time, deliveredBy, seenBy }
    const wrapper = document.createElement("div");
    wrapper.className = "msg" + (mine ? " me" : "");
    wrapper.dataset.messageId = msgObj.id;

    if (!mine) {
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${msgObj.username} • ${fmtTime(msgObj.time)}`;
        wrapper.appendChild(meta);
    } else {
        // for own messages we show time and status
        const meta = document.createElement("div");
        meta.className = "meta me-meta";
        meta.textContent = `${fmtTime(msgObj.time)}`;
        wrapper.appendChild(meta);
    }

    const text = document.createElement("div");
    text.className = "text";
    text.textContent = msgObj.text;
    wrapper.appendChild(text);

    // status container for send/deliver/seen icons (only for own messages)
    if (mine) {
        const status = document.createElement("div");
        status.className = "msg-status";
        status.innerHTML = `<span class="tick single" title="Sent">✓</span>`;
        wrapper.appendChild(status);
    }

    return wrapper;
}

function showMessage(msgObj) {
    if (displayed.has(msgObj.id)) return; // avoid duplicates
    const mine = msgObj.username === username;
    const el = createMessageElement(msgObj, mine);
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    displayed.set(msgObj.id, el);
}

// =======================================
//  Client -> Server: Send message
// =======================================
sendBtn.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text) return;

    const messageId = makeId();
    const payload = {
        id: messageId,
        room: roomCode,
        username,
        message: text,
        time: Date.now()
    };

    // Optimistically render message locally (marked as sent)
    showMessage({
        id: payload.id,
        username: username,
        text: payload.message,
        time: payload.time,
        deliveredBy: [],
        seenBy: []
    });

    // Emit to server
    socket.emit("chat-message", payload);

    chatInput.value = "";
});

// =======================================
//  When server sends initial history
// =======================================
socket.on("message-history", (messages) => {
    if (!Array.isArray(messages)) return;
    messages.forEach(msg => {
        showMessage(msg);
        // Immediately acknowledge receipt to server for delivery tracking
        socket.emit("message-received", { room: roomCode, messageId: msg.id });
    });
});

// =======================================
//  New message arrival from server
//  -> show and send 'message-received' ack
// =======================================
socket.on("new-message", (msgObj) => {
    // show message if not present
    showMessage(msgObj);

    // send delivered ack for this socket
    socket.emit("message-received", { room: roomCode, messageId: msgObj.id });
});

// =======================================
//  Message delivered to all: server notifies
//  -> update status icons for that messageId
// =======================================
socket.on("message-delivered", ({ messageId }) => {
    const el = displayed.get(messageId);
    if (!el) return;
    // update status element inside el
    const status = el.querySelector(".msg-status");
    if (status) {
        status.innerHTML = `<span class="tick double" title="Delivered">✓✓</span>`;
    }
});

// =======================================
//  Message seen update (server provides seenBy socket ids)
//  -> if current user is the sender, show seen tick; otherwise show seen for message when user sees
// =======================================
socket.on("message-seen", ({ messageId, seenBy }) => {
    const el = displayed.get(messageId);
    if (!el) return;

    // if I'm the sender and someone saw it, show seen style
    if (el.classList.contains("me")) {
        const status = el.querySelector(".msg-status");
        if (status) {
            // show double blue tick
            status.innerHTML = `<span class="tick double seen" title="Seen">✓✓</span>`;
        }
    }
});

// =======================================
//  When a user joins/leaves show notification
// =======================================
socket.on("user-joined", ({ username: u }) => {
    const notice = { id: "sys-" + Date.now() + Math.random().toString(36).slice(2,6), username: "System", text: `${u} joined`, time: Date.now() };
    showMessage(notice);
});
socket.on("user-left", ({ username: u }) => {
    const notice = { id: "sys-" + Date.now() + Math.random().toString(36).slice(2,6), username: "System", text: `${u} left`, time: Date.now() };
    showMessage(notice);
});

// =======================================
//  When client focuses / opens chat, mark all visible messages as seen
//  We'll detect when chat panel is in view or input is focused
// =======================================
function markVisibleMessagesAsSeen() {
    // mark latest messages as seen by this socket
    displayed.forEach((el, messageId) => {
        // skip if message already from me
        const isMine = el.classList.contains("me");
        // find message element and send seen only for messages not already seen by this socket
        // We'll tell server we saw it — server will store socket.id in seenBy and broadcast update
        socket.emit("message-seen", { room: roomCode, messageId });
    });
}

// call when chat input is focused (user viewing)
chatInput.addEventListener("focus", () => {
    markVisibleMessagesAsSeen();
});
// also call when user clicks anywhere on chat messages
chatMessages.addEventListener("click", () => {
    markVisibleMessagesAsSeen();
});

// =======================================
//  Emoji send + receive (already synced on server)
// =======================================
emojiBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const emoji = btn.innerText;
        socket.emit("emoji", { room: roomCode, username, emoji });
        // optionally render immediately (server will broadcast too)
        // showMessage({ id: makeId(), username, text: emoji, time: Date.now() }, true);
    });
});

socket.on("emoji", (data) => {
    // show as chat message and floating animation
    const msgIdLocal = makeId();
    showMessage({ id: msgIdLocal, username: data.username, text: data.emoji, time: Date.now() });

    // float
    const float = document.createElement("div");
    float.className = "floating-emoji";
    float.textContent = data.emoji;
    const rect = chatPanel.getBoundingClientRect();
    float.style.left = `${rect.left + rect.width/2}px`;
    float.style.top = `${rect.top + 20}px`;
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 1500);
});

// =======================================
//  Search button (opens results)
//// =======================================
searchBtn.addEventListener("click", () => {
    const q = (searchInput.value || "").trim();
    if (!q) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, "_blank");
});
// ====== Firebase Config ======
// TODO: Replace with your own Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ====== Get URL Params ======
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
const username = getQueryParam("name") || "Guest";
const roomCode = getQueryParam("room") || "XXXXXX";
const service = getQueryParam("service") || "youtube";

document.getElementById("user-name").textContent = username;
document.getElementById("room-code-top").textContent = `Room: ${roomCode}`;

// ====== Side Menu Toggle ======
const menuToggle = document.getElementById("menu-toggle");
const sideMenu = document.getElementById("side-menu");

menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("open");
});

// Close menu on clicking outside
document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        sideMenu.classList.remove("open");
    }
});

// ====== Dark/Light Toggle ======
document.getElementById("light-btn").addEventListener("click", () => {
    document.body.classList.remove("dark");
});
document.getElementById("dark-btn").addEventListener("click", () => {
    document.body.classList.add("dark");
});

// ====== Chat System ======
const chatInput = document.getElementById("chat-text");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");

function sendMessage(msg) {
    if (!msg) return;
    const newMsgRef = db.ref(`rooms/${roomCode}/messages`).push();
    newMsgRef.set({
        user: username,
        message: msg,
        timestamp: Date.now()
    });
    chatInput.value = "";
}

sendBtn.addEventListener("click", () => sendMessage(chatInput.value));
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage(chatInput.value);
});

// Listen for new messages
db.ref(`rooms/${roomCode}/messages`).on("child_added", snapshot => {
    const msg = snapshot.val();
    const p = document.createElement("p");
    const time = new Date(msg.timestamp).toLocaleTimeString();
    p.innerHTML = `<strong>${msg.user}</strong>: ${msg.message} <span class="timestamp">${time}</span>`;
    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
// === URL PARAMS ===
function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}

const username = getQueryParam('name') || 'Guest';
const roomCode = getQueryParam('room') || 'XXXXXX';
const service = getQueryParam('service') || 'youtube';

document.getElementById('user-name').textContent = username;
document.getElementById('room-code-top').textContent = `Room: ${roomCode}`;

// === ELEMENTS ===
const sideMenu = document.getElementById('side-menu');
const menuToggle = document.getElementById('menu-toggle');
const appearanceToggle = document.getElementById('appearance-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-text');
const sendBtn = document.getElementById('send-btn');
const emojiBtns = document.querySelectorAll('.emoji-btn');
const searchBarInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const participantsBtn = document.getElementById('participants-btn');

// ------------------------------------------------------------
// SIDE MENU TOGGLE
// ------------------------------------------------------------
menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sideMenu.classList.toggle('open');
});

/* Close left panel when clicking outside */
document.addEventListener('click', (e) => {
    const clickInside = sideMenu.contains(e.target) || menuToggle.contains(e.target);
    if (!clickInside) {
        sideMenu.classList.remove('open');
    }
});

/* Close panel with ESC key */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') sideMenu.classList.remove('open');
});

// ------------------------------------------------------------
// APPEARANCE (DARK / LIGHT) TOGGLE
// ------------------------------------------------------------
appearanceToggle.addEventListener('click', () => {
    appearanceToggle.classList.toggle('active');
    document.body.classList.toggle('light');
});

// ------------------------------------------------------------
// MEDIA PANEL (YOUTUBE / MUSIC / LOCAL)
// ------------------------------------------------------------
const mediaContainer = document.getElementById('media-container');

function loadSelectedService() {
    mediaContainer.innerHTML = ""; // Reset container

    // ------ YOUTUBE ------
    if (service === "youtube") {
        mediaContainer.innerHTML = `
            <iframe width="100%" height="350"
                src="https://www.youtube.com/embed/?controls=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>`;
    }

    // ------ YOUTUBE MUSIC (cannot embed normally, so using playlist) ------
    else if (service === "music") {
        mediaContainer.innerHTML = `
            <iframe width="100%" height="350"
                src="https://www.youtube.com/embed?list=RDCLAK5uy_kwfmMFDK7GdO81r0ZmIhgRNk_CXqQz0HI" 
                frameborder="0"
                allowfullscreen>
            </iframe>`;
    }

    // ------ LOCAL FILE PLAYBACK ------
    else if (service === "local") {
        mediaContainer.innerHTML = `
            <input id="fileInput" type="file" accept="video/*,audio/*">
            <video id="localVideo" width="100%" height="350" controls></video>
        `;

        const fileInput = document.getElementById('fileInput');
        const localVideo = document.getElementById('localVideo');

        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (file) localVideo.src = URL.createObjectURL(file);
        };
    }

    // ------ UNSUPPORTED ------
    else {
        mediaContainer.innerHTML = `<p style="opacity:0.6;">Unsupported Service</p>`;
    }
}

loadSelectedService();

// ------------------------------------------------------------
// MEDIA CONTROLS
// ------------------------------------------------------------
document.getElementById('play').onclick = () => {
    const v = document.querySelector('#media-container video');
    v?.play();
};

document.getElementById('pause').onclick = () => {
    const v = document.querySelector('#media-container video');
    v?.pause();
};

document.getElementById('next').onclick = () => {
    alert("Next feature coming soon!");
};

document.getElementById('prev').onclick = () => {
    alert("Previous feature coming soon!");
};

// ------------------------------------------------------------
// CHAT SYSTEM (LOCAL FOR NOW — REALTIME COMING NEXT)
// ------------------------------------------------------------
function addMessage(user, text, mine = false) {
    const wrap = document.createElement("div");
    wrap.className = "msg" + (mine ? " me" : "");

    if (!mine) {
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = user;
        wrap.appendChild(meta);
    }

    const txt = document.createElement("div");
    txt.className = "text";
    txt.textContent = text;

    wrap.appendChild(txt);
    chatMessages.appendChild(wrap);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(username, text, true);
    chatInput.value = "";
});

chatInput.addEventListener("keypress", (ev) => {
    if (ev.key === "Enter") sendBtn.click();
});

// ------------------------------------------------------------
// EMOJIS — FLOATING ANIMATION
// ------------------------------------------------------------
emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const emoji = btn.innerText;
        addMessage(username, emoji, true);

        const float = document.createElement("div");
        float.className = "floating-emoji";
        float.textContent = emoji;

        const rect = chatPanel.getBoundingClientRect();
        float.style.left = `${rect.left + rect.width / 2}px`;
        float.style.top = `${rect.top + 40}px`;

        document.body.appendChild(float);
        setTimeout(() => float.remove(), 1500);
    });
});

// ------------------------------------------------------------
// SEARCH BAR — OPENS YOUTUBE RESULTS
// ------------------------------------------------------------
searchBtn.addEventListener('click', () => {
    const q = searchBarInput.value.trim();
    if (!q) return;

    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
});

// Participant popup (placeholder)
participantsBtn.addEventListener('click', () => {
    alert("Participants list coming soon!");
});

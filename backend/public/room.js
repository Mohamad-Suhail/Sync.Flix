// =======================
// GET URL PARAMS
// =======================
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const username = getQueryParam("name") || "Guest";
const roomCode = getQueryParam("room") || "XXXXXX";
const service = getQueryParam("service") || "youtube";

document.getElementById("user-name").textContent = username;
document.getElementById("room-code-top").textContent = `Room: ${roomCode}`;

// =======================
// MEDIA LOADING
// =======================
const mediaContainer = document.getElementById("media-container");
let youtubePlayer = null;
let audioPlayer = null;

// Load media based on service
function loadSelectedService() {

    if (service === "youtube") {
        mediaContainer.innerHTML = `
            <iframe id="yt-player"
                width="100%" height="350"
                src="https://www.youtube.com/embed/?controls=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope;"
                allowfullscreen>
            </iframe>
        `;

        youtubePlayer = document.getElementById("yt-player");
    }

    else if (service === "youtube-music") {
        mediaContainer.innerHTML = `
            <iframe 
                width="100%" height="350"
                src="https://music.youtube.com/"
                frameborder="0">
            </iframe>
        `;
    }

    else if (service === "vlc") {
        mediaContainer.innerHTML = `
            <input type="file" id="fileInput" accept="video/*,audio/*">
            <video id="localVideo" width="100%" height="350" controls></video>
        `;

        const fileInput = document.getElementById("fileInput");
        const localVideo = document.getElementById("localVideo");

        fileInput.addEventListener("change", () => {
            const file = fileInput.files[0];
            if (file) {
                localVideo.src = URL.createObjectURL(file);
            }
        });
    }
}

loadSelectedService();

// =======================
// CONTROL BUTTONS
// =======================
document.getElementById("play").addEventListener("click", () => {
    if (service === "vlc") {
        document.getElementById("localVideo")?.play();
    }
});

document.getElementById("pause").addEventListener("click", () => {
    if (service === "vlc") {
        document.getElementById("localVideo")?.pause();
    }
});


// =======================
// SIDE MENU
// =======================
const sideMenu = document.getElementById("side-menu");
document.getElementById("menu-toggle").addEventListener("click", () => {
    sideMenu.classList.toggle("open");
});

document.addEventListener("click", e => {
    if (!sideMenu.contains(e.target) && !document.getElementById("menu-toggle").contains(e.target)) {
        sideMenu.classList.remove("open");
    }
});

// =======================
// DARK MODE
// =======================
document.getElementById("light-btn").onclick = () =>
    document.body.classList.remove("dark");

document.getElementById("dark-btn").onclick = () =>
    document.body.classList.add("dark");


// =======================
// CHAT SYSTEM (SKIPPED UNTIL BACKEND DECISION)
// =======================
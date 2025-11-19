// Get URL params
function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

document.getElementById("user-name").textContent =
    getQueryParam("name") || "Guest";

document.getElementById("room-code-top").textContent =
    "Room: " + (getQueryParam("room") || "XXXXXX");

// Side Menu Toggle
const sideMenu = document.getElementById("side-menu");
document.getElementById("menu-toggle").onclick = () => {
    sideMenu.classList.toggle("open");
};

// Appearance Toggle
const toggleSwitch = document.getElementById("appearance-toggle");

toggleSwitch.onclick = () => {
    toggleSwitch.classList.toggle("active");
    document.body.classList.toggle("light");
};

// MEDIA CONTAINER
const service = getQueryParam("service") || "youtube";
const mediaContainer = document.getElementById("media-container");

function loadSelectedService() {
    if (service === "youtube") {
        mediaContainer.innerHTML = `
            <iframe width="100%" height="350" 
            src="https://www.youtube.com/embed/?controls=1"
            allowfullscreen></iframe>`;
    } else if (service === "vlc") {
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
}

loadSelectedService();

// PLAY / PAUSE
document.getElementById("play").onclick = () => {
    document.getElementById("localVideo")?.play();
};
document.getElementById("pause").onclick = () => {
    document.getElementById("localVideo")?.pause();
};
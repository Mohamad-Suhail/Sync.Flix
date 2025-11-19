// URL PARAMS
function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

const username = getQueryParam("name") || "Guest";
const roomCode = getQueryParam("room") || "XXXX";
const service = getQueryParam("service") || "youtube";

document.getElementById("user-name").textContent = username;
document.getElementById("room-code-top").textContent = "Room: " + roomCode;

// =======================
// MEDIA LOADING
// =======================
const mediaContainer = document.getElementById("media-container");

function loadMedia() {
    if (service === "youtube") {
        mediaContainer.innerHTML =
        `<iframe width="100%" height="360"
            src="https://www.youtube.com/embed/"
            frameborder="0" allowfullscreen></iframe>`;
    }
}
loadMedia();

// =======================
// MENU TOGGLE
// =======================
const menu = document.getElementById("side-menu");
document.getElementById("menu-toggle").onclick = () => {
    menu.classList.toggle("open");
};

document.addEventListener("click", e => {
    if (!menu.contains(e.target) && !document.getElementById("menu-toggle").contains(e.target)) {
        menu.classList.remove("open");
    }
});

// =======================
// DARK MODE SWITCH
// =======================
const toggle = document.getElementById("theme-toggle");

toggle.addEventListener("change", () => {
    if (toggle.checked) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
});

// APPEARANCE TOGGLE (iOS Style)
const toggleSwitch = document.getElementById("appearance-toggle");

toggleSwitch.addEventListener("click", () => {
    toggleSwitch.classList.toggle("active");
    document.body.classList.toggle("light");
});

// Chat + emojis + search can be added later
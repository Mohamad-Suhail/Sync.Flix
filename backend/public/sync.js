// -----------------------------
// Get URL Parameters
// -----------------------------
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Get username and room code
const username = getQueryParam("name") || "Guest";
const roomCode = getQueryParam("room") || "XXXXXX";

// Update UI
document.getElementById("welcome").textContent = `Welcome, ${username}`;
const roomCodeElement = document.getElementById("room-code");
roomCodeElement.textContent = roomCode;

// Copy Room Code
roomCodeElement.addEventListener("click", () => {
    navigator.clipboard.writeText(roomCode)
        .then(() => alert("Room code copied!"))
        .catch(() => alert("Failed to copy code!"));
});

// -----------------------------
// Redirect to ROOM PAGE
// -----------------------------
const serviceButtons = document.querySelectorAll(".service-btn");
serviceButtons.forEach(button => {
    button.addEventListener("click", () => {

        let service = "";
        if (button.classList.contains("youtube")) service = "youtube";
        else if (button.classList.contains("youtube-music")) service = "youtube-music";
        else if (button.classList.contains("vlc")) service = "vlc";

        // Redirect properly to room.html
        window.location.href =
            `room.html?name=${encodeURIComponent(username)}&room=${encodeURIComponent(roomCode)}&service=${encodeURIComponent(service)}`;
    });
});
// Function to get URL parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Get username and room code from URL
const username = getQueryParam("name") || "Guest";
const roomCode = getQueryParam("room") || "XXXXXX";

// Update page
document.getElementById("welcome").textContent = `Welcome, ${username}`;
const roomCodeElement = document.getElementById("room-code");
roomCodeElement.textContent = roomCode;

// Copy room code
roomCodeElement.addEventListener("click", () => {
    navigator.clipboard.writeText(roomCode);
    alert("Room code copied!");
});

// Handle service buttons
document.querySelectorAll(".service-btn").forEach(button => {

    button.addEventListener("click", () => {
        let service = "";

        if (button.classList.contains("youtube")) service = "youtube";
        if (button.classList.contains("youtube-music")) service = "music";
        if (button.classList.contains("vlc")) service = "local";

        // Redirect to room page with correct parameters
        window.location.href =
            `room.html?name=${encodeURIComponent(username)}&room=${encodeURIComponent(roomCode)}&service=${encodeURIComponent(service)}`;
    });
});
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

// Copy to Clipboard
roomCodeElement.addEventListener("click", () => {
    navigator.clipboard.writeText(roomCode)
        .then(() => alert("Room code copied!"))
        .catch(err => alert("Failed to copy code!"));
});

// Optional: You can add click events for service buttons if needed
const serviceButtons = document.querySelectorAll(".service-btn");
serviceButtons.forEach(button => {
    button.addEventListener("click", () => {
        const service = button.textContent.trim();
        alert(`You selected: ${service}`);
        // Later, you can redirect to the actual service page
    });
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

// Copy to Clipboard
roomCodeElement.addEventListener("click", () => {
    navigator.clipboard.writeText(roomCode)
        .then(() => alert("Room code copied!"))
        .catch(err => alert("Failed to copy code!"));
});

// Redirect to Room Page with service selection
const serviceButtons = document.querySelectorAll(".service-btn");
serviceButtons.forEach(button => {
    button.addEventListener("click", () => {
        let service = "";
        if(button.classList.contains("youtube")) service = "youtube";
        else if(button.classList.contains("youtube-music")) service = "youtube-music";
        else if(button.classList.contains("vlc")) service = "vlc";

        // Redirect to room.html with parameters
        window.location.href = `room.html?name=${encodeURIComponent(username)}&room=${encodeURIComponent(roomCode)}&service=${encodeURIComponent(service)}`;
    });
});
});
const loginBtn = document.getElementById("login-btn");
const username = document.getElementById("username");
const autoRoom = document.getElementById("auto-room");
const manualRoom = document.getElementById("manual-room");
const joinRoom = document.getElementById("join-room");

let generatedRoom = "";

// =====================================
// AUTO GENERATE ROOM (HOST CREATES ROOM)
// =====================================
autoRoom.addEventListener("click", async () => {
    const name = username.value.trim();

    if (!name) {
        alert("Please enter your name first!");
        return;
    }

    // Generate 6-digit alphanumeric room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Send to backend to REGISTER THE ROOM
    const res = await fetch("https://sync-flix.onrender.com/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomCode })
    });

    const data = await res.json();

    if (!data.success) {
        alert("Room creation failed!");
        return;
    }

    generatedRoom = roomCode;
    manualRoom.value = generatedRoom;

    alert(`Room Created: ${generatedRoom}`);
});


// ================================
// LOGIN — HOST or PARTICIPANT
// ================================
loginBtn.addEventListener("click", async () => {
    const name = username.value.trim();
    const manual = manualRoom.value.trim();   // Host code
    const join = joinRoom.value.trim();       // Participant joins

    if (!name) {
        alert("Please enter your name!");
        return;
    }

    if (!manual && !join) {
        alert("Please create or join a room!");
        return;
    }

    // ======================
    // Case 1 → HOST LOGIN
    // ======================
    if (manual) {
        window.location.href =
            `sync.html?name=${encodeURIComponent(name)}&room=${manual}&role=host`;

        return;
    }

    // ======================
    // Case 2 → PARTICIPANT
    // Validate room
    // ======================
    const res = await fetch("https://sync-flix.onrender.com/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: name,
            room: join
        })
    });

    const data = await res.json();

    if (!data.success) {
        alert("Invalid or expired room code!");
        return;
    }

    window.location.href =
        `sync.html?name=${encodeURIComponent(name)}&room=${join}&role=participant`;
});
const loginBtn = document.getElementById("login-btn");
const username = document.getElementById("username");
const autoRoom = document.getElementById("auto-room");
const manualRoom = document.getElementById("manual-room");
const joinRoom = document.getElementById("join-room");

let generatedRoom = "";

// ========================
// AUTO GENERATE ROOM (HOST)
// ========================
autoRoom.addEventListener("click", async () => {
    const name = username.value.trim();
    if (!name) {
        alert("Please enter your name first!");
        return;
    }

    const res = await fetch("https://sync-flix.onrender.com/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name })
    });

    const data = await res.json();

    if (!data.success) {
        alert("Room creation failed!");
        return;
    }

    generatedRoom = data.room;
    manualRoom.value = generatedRoom;
    alert(`Room Created: ${generatedRoom}`);
});


// ========================
// ENTER ROOM
// ========================
loginBtn.addEventListener("click", async () => {
    const name = username.value.trim();
    const manual = manualRoom.value.trim();
    const join = joinRoom.value.trim();

    if (!name) {
        alert("Please enter your name!");
        return;
    }

    if (!manual && !join) {
        alert("Please create or join a room!");
        return;
    }

    // HOST LOGIN
    if (manual) {
        window.location.href =
            `sync.html?name=${encodeURIComponent(name)}&room=${manual}&role=host`;
        return;
    }

    // PARTICIPANT LOGIN
    const res = await fetch("https://sync-flix.onrender.com/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: name,
            roomCode: join
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
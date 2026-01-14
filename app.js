/* ================================
   SOCKET.IO – POLLING ONLY (STABLE)
   ================================ */

const socket = io("https://screen-share-phhn.onrender.com", {
  transports: ["polling"],      // ✅ FINAL FIX (no websocket)
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 30000
});

/* ================================
   ELEMENT REFERENCES
   ================================ */

const statusText = document.getElementById("statusText");
const myCodeEl = document.getElementById("myCode");
const connectBtn = document.getElementById("connectBtn");
const joinCodeInput = document.getElementById("joinCode");
const sessionBar = document.getElementById("sessionBar");
const timerEl = document.getElementById("timer");
const disconnectBtn = document.getElementById("disconnectBtn");
const clearBtn = document.getElementById("clearBtn");

/* ================================
   STATE
   ================================ */

let room = null;
let startTime = null;
let timerInterval = null;

/* ================================
   SOCKET STATUS
   ================================ */

statusText.innerText = "Connecting to server...";

socket.on("connect", () => {
  statusText.innerText = "Server Connected ✅";
  socket.emit("request-code");
});

socket.on("disconnect", () => {
  statusText.innerText = "Disconnected ❌";
});

socket.on("connect_error", (err) => {
  statusText.innerText = "Server Connection Failed ❌";
  console.error("Socket error:", err.message);
  alert("Socket error: " + err.message);
});

/* ================================
   CODE SYSTEM
   ================================ */

socket.on("your-code", (code) => {
  myCodeEl.innerText = code;
});

/* ================================
   CONNECT / JOIN
   ================================ */

connectBtn.onclick = () => {
  const code = joinCodeInput.value.trim();
  if (code.length !== 4) {
    alert("Please enter 4-digit code");
    return;
  }
  room = code;
  socket.emit("join-code", room);
};

socket.on("join-success", () => {
  startSession();
});

socket.on("peer-joined", () => {
  startSession();
});

socket.on("join-failed", (msg) => {
  alert(msg || "Invalid code");
});

/* ================================
   SESSION TIMER
   ================================ */

function startSession() {
  if (!sessionBar.classList.contains("hidden")) return;

  sessionBar.classList.remove("hidden");
  startTime = Date.now();

  timerInterval = setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    timerEl.innerText = `${m}:${s}`;
  }, 1000);
}

/* ================================
   DISCONNECT
   ================================ */

disconnectBtn.onclick = () => {
  location.reload();
};

/* ================================
   DRAWING (ANNOTATION)
   ================================ */

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.lineCap = "round";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let drawing = false;

canvas.addEventListener("pointerdown", (e) => {
  if (!room) return;
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("pointerup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing || !room) return;

  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  socket.emit("draw", {
    room,
    x: e.offsetX,
    y: e.offsetY
  });
});

socket.on("draw", (data) => {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
});

/* ================================
   CLEAR CANVAS
   ================================ */

clearBtn.onclick = () => {
  if (!room) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear-canvas", room);
};

socket.on("clear-canvas", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

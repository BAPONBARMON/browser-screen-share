const socket = io("https://screen-share-phhn.onrender.com", {
  path: "/socket.io",
  transports: ["websocket"],
  secure: true,
  reconnection: true,
  timeout: 20000
});

const statusText = document.getElementById("statusText");
const myCodeEl = document.getElementById("myCode");
const connectBtn = document.getElementById("connectBtn");
const joinCodeInput = document.getElementById("joinCode");
const sessionBar = document.getElementById("sessionBar");
const timerEl = document.getElementById("timer");
const disconnectBtn = document.getElementById("disconnectBtn");

let room = null;
let startTime = null;
let timerInterval = null;

/* SOCKET STATUS */
socket.on("connect", () => {
  statusText.innerText = "Server Connected ✅";
  socket.emit("request-code");
});

socket.on("connect_error", (err) => {
  statusText.innerText = "Server Connection Failed ❌";
  alert("Socket error: " + err.message);
});

/* CODE */
socket.on("your-code", (code) => {
  myCodeEl.innerText = code;
});

/* CONNECT */
connectBtn.onclick = () => {
  room = joinCodeInput.value;
  socket.emit("join-code", room);
};

socket.on("join-success", () => startSession());
socket.on("peer-joined", () => startSession());

function startSession() {
  sessionBar.classList.remove("hidden");
  startTime = Date.now();

  timerInterval = setInterval(() => {
    let sec = Math.floor((Date.now() - startTime) / 1000);
    let m = String(Math.floor(sec / 60)).padStart(2, "0");
    let s = String(sec % 60).padStart(2, "0");
    timerEl.innerText = `${m}:${s}`;
  }, 1000);
}

/* DISCONNECT */
disconnectBtn.onclick = () => location.reload();

/* DRAWING */
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let drawing = false;

canvas.addEventListener("pointerdown", () => drawing = true);
canvas.addEventListener("pointerup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing || !room) return;

  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  socket.emit("draw", { x: e.offsetX, y: e.offsetY, room });
});

socket.on("draw", (data) => {
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
});

document.getElementById("clearBtn").onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear-canvas", room);
};

socket.on("clear-canvas", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

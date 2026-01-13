const socket = io("https://screen-share-phhn.onrender.com"); // 🔴 अपना backend URL

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

/* SERVER CONNECT */
socket.on("connect", ()=>{
  document.body.classList.add("connected");
  statusText.innerText = "Server Connected ✅";
  socket.emit("request-code");
});

/* RECEIVE CODE */
socket.on("your-code",(code)=>{
  myCodeEl.innerText = code;
});

/* CONNECT TO OTHER */
connectBtn.onclick = ()=>{
  room = joinCodeInput.value;
  socket.emit("join-code", room);
};

socket.on("join-success",()=>{
  startSession();
});

socket.on("peer-joined",()=>{
  startSession();
});

/* SESSION */
function startSession(){
  sessionBar.classList.remove("hidden");
  startTime = Date.now();

  timerInterval = setInterval(()=>{
    let sec = Math.floor((Date.now()-startTime)/1000);
    let m = String(Math.floor(sec/60)).padStart(2,"0");
    let s = String(sec%60).padStart(2,"0");
    timerEl.innerText = `${m}:${s}`;
  },1000);
}

/* DISCONNECT */
disconnectBtn.onclick = ()=>{
  location.reload();
};

/* DRAWING */
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener("pointerdown",()=>{
  drawing=true;
});
canvas.addEventListener("pointerup",()=>{
  drawing=false;
  ctx.beginPath();
});
canvas.addEventListener("pointermove",(e)=>{
  if(!drawing) return;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  ctx.lineTo(e.clientX,e.clientY);
  ctx.stroke();

  socket.emit("draw",{x:e.clientX,y:e.clientY,room});
});

/* RECEIVE DRAW */
socket.on("draw",(data)=>{
  ctx.lineTo(data.x,data.y);
  ctx.stroke();
});

socket.on("clear-canvas",()=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);
});

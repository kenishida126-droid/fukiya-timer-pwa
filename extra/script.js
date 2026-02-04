/* ===== 設定値 ===== */
const TOTAL = 185;   // 3:05
const READY = 180;

let time = TOTAL;
let running = false;
let finished = false;
let intervalId = null;
let shotPace = false;
let prevIndex = -1;

/* ===== WakeLock ===== */
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch {}
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && running) {
    requestWakeLock();
  }
});

/* ===== DOM ===== */
const timer = document.getElementById("timer");
const arrows = [...document.querySelectorAll(".arrow")];
const label = document.getElementById("label");

/* ===== Shot Pace 範囲 ===== */
const ranges = [
  [180, 142],
  [141, 108],
  [107, 74],
  [73, 40],
  [39, 0]
];

/* ===== Beep ===== */
const ctx = new (window.AudioContext || window.webkitAudioContext)();

function beepArrow() {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.value = 2000;
  g.gain.value = 0.6;
  o.start();
  o.stop(ctx.currentTime + 0.08);
}

function beepTap() {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.value = 1800;
  g.gain.value = 0.15;
  o.start();
  o.stop(ctx.currentTime + 0.05);
}

/* ===== 音声 ===== */
const audioStart = new Audio("start-0.mp3");
const audio30 = new Audio("30sec.mp3");
const audioEnd = new Audio("end.mp3");

/* ===== 表示更新 ===== */
function updateTimer() {
  const m = Math.floor(time / 60);
  const s = time % 60;
  timer.textContent = `${m}:${s.toString().padStart(2, "0")}`;

  timer.className = "";
  if (time === TOTAL || time > READY) {
    timer.classList.add("timer-lime");
  } else if (time > 30) {
    timer.classList.add("timer-gold");
  } else if (time > 0) {
    timer.classList.add("timer-red", "blink-slow");
  } else {
    timer.classList.add("timer-lime", "blink-fast");
  }
}

/* ===== 矢制御 ===== */
function arrowsOff() {
  arrows.forEach(a => {
    a.classList.remove("blink");
    a.style.visibility = "hidden";
  });
  label.style.display = "flex";
}

function arrowsOn() {
  arrows.forEach(a => {
    a.classList.remove("blink");
    a.style.visibility = "visible";
  });
  label.style.display = "none";
}

function updateArrows() {
  const idx = ranges.findIndex(r => time <= r[0] && time >= r[1]);

  arrows.forEach((a, i) => {
    a.classList.remove("blink");
    a.style.visibility = time < ranges[i][1] ? "hidden" : "visible";
  });

  if (idx >= 0 && time > 0) {
    arrows[idx].classList.add("blink");
    if (prevIndex >= 0 && idx !== prevIndex) {
      beepArrow();
    }
  }
  prevIndex = idx;
}

/* ===== 初期化（明示リセット専用） ===== */
function resetAll() {
  clearInterval(intervalId);
  intervalId = null;
  running = false;
  finished = false;
  releaseWakeLock();

  time = TOTAL;
  prevIndex = -1;

  updateTimer();
  shotPace ? arrowsOn() : arrowsOff();
}

/* ===== タイマータップ ===== */
timer.onclick = async () => {
  beepTap();

  // 終了状態 → 明示リセット
  if (finished) {
    resetAll();
    return;
  }

  // 初回スタート
  if (!running && time === TOTAL) {
    running = true;
    await requestWakeLock();

    intervalId = setInterval(() => {

      if (time === 182) audioStart.play();
      if (time === 31) audio30.play();
      if (time === 1) audioEnd.play();

      time--;
      updateTimer();

      if (shotPace && time <= READY) {
        updateArrows();
      }

      // 終了処理（自動リセットしない）
      if (time <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        running = false;
        finished = true;
        releaseWakeLock();

        if (shotPace) arrowsOff();
      }

    }, 1000);
    return;
  }

  // 動作中タップ → 強制リセット
  if (running) {
    resetAll();
  }
};

/* ===== Shot Pace 切替 ===== */
shotpace.onclick = () => {
  if (running) return;
  shotPace = !shotPace;
  shotPace ? arrowsOn() : arrowsOff();
};

/* ===== 初期表示 ===== */
updateTimer();
arrowsOff();

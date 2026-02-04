/* ===== 状態変数 ===== */
let timer = null;
let remaining = 180;
let started = false;
let audioStartTimeout = null;
let currentAudioStart = null;
let wakeLock = null;

const rounds = [
  "～ 練習ラウンド ～",
  "～ 第１ラウンド ～",
  "～ 第２ラウンド ～",
  "～ 第３ラウンド ～",
  "～ 第４ラウンド ～",
  "～ 第５ラウンド ～",
  "～ 最終ラウンド ～"
];
let roundIndex = 0;

/* locks */
let cleanOn = true;   // initial ON
let bounceOn = false; // 撥ね矢 initial OFF

/* wallpaper */
const MAX_WALL = 30;
let wallpapers = [], currentIndex = 0;
let wallpaperOn = false; // default if no saved state

/* metronome */
let audioCtx = null;
let metronomeTimer = null;
let selectedToneId = 'tone-1';
const externalToneAvailable = {};
const externalAudioElements = {};

/* pulse control */
let pulseFired = { "3_05": false, "3_00": false, "0_30": false, "0_10": false, "0_00": false };
const PULSE_MS = 520;

/* Ver.06.1 additions:
   - selectedStartSeconds: null or number (188,187,186)
   - selectionIndex cycles 0..2 mapping to array startOptions
*/
const startOptions = [188,187,186]; // 3:08,3:07,3:06 (seconds)
let selectionIndex = -1; // -1 means no selection active
let selectedStartSeconds = null;

/* DOM */
const timeDiv = document.getElementById("time");
const roundLabel = document.getElementById("roundLabel");
const cleanBtn = document.getElementById("cleanBtn");
const startBtn = document.getElementById("startBtn");
const bounceBtn = document.getElementById("bounceBtn");
const resetBtn = document.getElementById("resetBtn");
const wallToggle = document.getElementById("wallToggle");
const wallToggleLabel = document.getElementById("wallToggleLabel");
const wallNumEl = document.getElementById("wallNum");
const metroToggle = document.getElementById("metroToggle");
const metroToggleLabel = document.getElementById("metroToggleLabel");
const toneRadios = document.querySelectorAll('input[name="metronomeTone"]');
const audio30 = document.getElementById('audio30');
const audioEnd = document.getElementById('audioEnd');
const audioEndHaneya = document.getElementById('audioEndHaneya');
const audioEndTandoku = document.getElementById('audioEndTandoku');
const audioClean = document.getElementById('audioClean');
const timeOverlay = document.getElementById('timeOverlay'); /* overlay element */
const mainTitle = document.getElementById('mainTitle'); /* タイトル要素 */

/* helper: format time */
function formatTime(sec){ if(sec<0) sec=0; const m=Math.floor(sec/60); const s=sec%60; return `${m}:${s<10?'0'+s:s}`; }

/* WakeLock */
async function enableWakeLock(){ try{ if('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); }catch(e){ wakeLock = null; } }
async function disableWakeLock(){ try{ if(wakeLock){ await wakeLock.release(); wakeLock = null; } }catch(e){ wakeLock = null; } }

/* pulse once */
function doPulseOnce(key){
  if(pulseFired[key]) return;
  pulseFired[key] = true;
  timeDiv.classList.add('pulse');
  setTimeout(()=>{ timeDiv.classList.remove('pulse'); }, PULSE_MS);
}

/* update display (Ver.05.8 behavior + Ver.06.1 selection handling) */
function updateDisplay(){
  const m = Math.floor(remaining/60), s = remaining%60;
  const disp = m + ":" + (s<10 ? "0"+s : s);
  timeDiv.textContent = disp;

  timeDiv.classList.remove('pulse','blink','fast-blink');

  // If selection active and NOT started => show lime and keep it
  if(!started && selectedStartSeconds !== null){
    timeDiv.style.color = "#00ff00";
    timeDiv.style.textShadow = "0 0 20px #00ff00,2px 2px 5px rgba(0,0,0,0.5)";
    return;
  }

  // STARTED behaviors (preserve 3:05 pulse and ensure selection-start shows lime until reaching 180)
  // 3:05 pulse: prefer this check first (works when starting with selectedStartSeconds >=185 or default)
  if(started && remaining === 185){
    timeDiv.style.color = "#00ff00";
    timeDiv.style.textShadow = "0 0 20px #00ff00,2px 2px 5px rgba(0,0,0,0.5)";
    doPulseOnce("3_05");
    return;
  }

  // Green region: if started and remaining between 181 and upper bound.
  // Upper bound: if user selected a larger start, use selectedStartSeconds; otherwise legacy upper bound 184.
  if(started && remaining >= 181){
    const upper = selectedStartSeconds !== null ? Math.max(184, selectedStartSeconds) : 184;
    if(remaining <= upper){
      timeDiv.style.color = "#00ff00";
      timeDiv.style.textShadow = "0 0 20px #00ff00,2px 2px 5px rgba(0,0,0,0.5)";
      return;
    }
  }

  // 3:00 event (exact) keeps old behavior
  if(started && remaining === 180){
    timeDiv.style.color = "var(--timer-gold)";
    timeDiv.style.textShadow = "0 0 25px rgba(212,175,55,0.95),2px 2px 5px rgba(0,0,0,0.7)";
    doPulseOnce("3_00");
    return;
  }

  if(remaining <= 179 && remaining >= 31){
    timeDiv.style.color = "var(--timer-gold)";
    timeDiv.style.textShadow = "0 0 25px rgba(212,175,55,0.95),2px 2px 5px rgba(0,0,0,0.7)";
    return;
  }
  if(started && remaining === 30){
    timeDiv.style.color = "#ff0000";
    timeDiv.style.textShadow = "0 0 25px #ff0000,2px 2px 5px rgba(0,0,0,0.5)";
    doPulseOnce("0_30");
    return;
  }
  if(remaining <= 29 && remaining >= 11){
    timeDiv.style.color = "#ff0000";
    timeDiv.style.textShadow = "0 0 25px #ff0000,2px 2px 5px rgba(0,0,0,0.5)";
    return;
  }
  if(started && remaining === 10){
    timeDiv.style.color = "#ff0000";
    timeDiv.style.textShadow = "0 0 25px #ff0000,2px 2px 5px rgba(0,0,0,0.5)";
    doPulseOnce("0_10");
    return;
  }
  if(remaining <= 9 && remaining >= 1){
    timeDiv.style.color = "#ff0000";
    timeDiv.style.textShadow = "0 0 25px #ff0000,2px 2px 5px rgba(0,0,0,0.5)";
    timeDiv.classList.add('blink');
    return;
  }
  if(started && remaining === 0){
    timeDiv.style.color = "#00ff00";
    timeDiv.style.textShadow = "0 0 25px #00ff00,2px 2px 5px rgba(0,0,0,0.5)";
    timeDiv.classList.remove('blink');
    timeDiv.classList.add('fast-blink');
    doPulseOnce("0_00");
    return;
  }

  // default
  timeDiv.style.color = "var(--timer-gold)";
  timeDiv.style.textShadow = "0 0 25px rgba(212,175,55,0.95),2px 2px 5px rgba(0,0,0,0.7)";
}

/* start timer */
/* Ver.06.1: if selectedStartSeconds != null -> start from that; else legacy behavior (185) */
function startTimer(){
  if(timer) return;
  started = true;
  pulseFired = { "3_05": false, "3_00": false, "0_30": false, "0_10": false, "0_00": false };

  // If user selected a start value (188/187/186), start from that seconds.
  if(selectedStartSeconds !== null){
    remaining = selectedStartSeconds;
  } else {
    // legacy: start from 185 so that 3:05 pulse appears as before
    remaining = 185;
  }

  updateDisplay();
  enableWakeLock();

  startBtn.classList.add('pressed');
  startBtn.classList.add('locked');

  // start audio that should finish exactly when remaining reaches 180
  const audioStart = new Audio(`start-${roundIndex}.mp3`);
  currentAudioStart = audioStart;
  audioStart.preload = 'auto';
  audioStart.addEventListener('loadedmetadata', ()=>{
    const dur = audioStart.duration || 0;
    const playAt = 180 + dur;
    const delaySeconds = remaining - playAt;
    const delayMs = Math.max(0, Math.round(delaySeconds*1000));
    if(audioStartTimeout){ clearTimeout(audioStartTimeout); audioStartTimeout=null; }
    if(delayMs === 0) audioStart.play().catch(()=>{});
    else audioStartTimeout = setTimeout(()=>{ audioStart.play().catch(()=>{}); audioStartTimeout=null; }, delayMs);
  });
  audioStart.load();

  timer = setInterval(()=>{
    remaining--;
    updateDisplay();

    if(remaining === 30) audio30.play().catch(()=>{});

    if(remaining === 0){
      clearInterval(timer); timer=null;
      if(audioStartTimeout){ clearTimeout(audioStartTimeout); audioStartTimeout=null; }
      if(currentAudioStart){ try{ currentAudioStart.pause(); currentAudioStart.currentTime=0; }catch(e){} currentAudioStart=null; }

      if(bounceOn){
        // 撥ね矢 ON -> play end_haneya
        audioEndHaneya.play().catch(()=>{});
        // keep wakeLock until user handles reset (per spec)
      } else {
        audioEnd.play().catch(()=>{});
        if(cleanOn){
          audioEnd.addEventListener('ended', function once(){ setTimeout(()=>{ audioClean.play().catch(()=>{}); },1000); audioEnd.removeEventListener('ended', once); }, { once:true });
        }
        disableWakeLock();
      }

      started = false;
      // clear start pressed visuals
      startBtn.classList.remove('pressed'); startBtn.classList.remove('locked');

      // After countdown finishes, selection remains cleared (we treat selection only pre-start)
      selectedStartSeconds = null;
      selectionIndex = -1;
    }

    if(remaining < 0){
      clearInterval(timer); timer=null;
      started = false;
    }
  },1000);
}

/* reset action / 撥矢/終了 handling */
function resetAction(){
  if(bounceOn && remaining === 0){
    // 撥矢/終了 pressed when bounceOn and 0:00 => play end_tandoku then clear bounceOn
    audioEndTandoku.play().catch(()=>{});
    audioEndTandoku.addEventListener('ended', ()=>{
      if(cleanOn){ setTimeout(()=>{ audioClean.play().catch(()=>{}); },1000); }
      bounceOn = false; setBounceVisual();
      disableWakeLock();
    }, { once:true });
    return;
  }

  // normal reset
  if(timer){ clearInterval(timer); timer=null; }
  if(audioStartTimeout){ clearTimeout(audioStartTimeout); audioStartTimeout=null; }
  if(currentAudioStart){ try{ currentAudioStart.pause(); currentAudioStart.currentTime=0; }catch(e){} currentAudioStart=null; }
  disableWakeLock();
  remaining = 180; started=false;
  pulseFired = { "3_05": false, "3_00": false, "0_30": false, "0_10": false, "0_00": false };
  timeDiv.classList.remove('pulse','blink','fast-blink');

  // Ver.06.1: Clear selection when reset/解除 pressed
  // <- MOVED BEFORE updateDisplay() to ensure updateDisplay doesn't detect selection and show lime.
  selectedStartSeconds = null;
  selectionIndex = -1;

  timeDiv.style.color = "var(--timer-gold)";
  timeDiv.style.textShadow = "0 0 25px rgba(212,175,55,0.95),2px 2px 5px rgba(0,0,0,0.7)";
  updateDisplay();

  // metronome OFF on reset (per spec)
  if(metroToggle){
    metroToggle.checked = false;
    updateMetronomeLabel();
    stopMetronome();
  }

  // clear start visual if any
  startBtn.classList.remove('pressed'); startBtn.classList.remove('locked');

  // bounce reset
  bounceOn = false; setBounceVisual();

  /* === tolk-♪ 追加部分 ===
     音声再生中(タイトルクリックで再生された tolk-*.mp3)の停止処理をここで行う
  */
  if(window.currentTolkAudio){
    try{ window.currentTolkAudio.pause(); window.currentTolkAudio.currentTime = 0; }catch(e){}
    window.currentTolkAudio = null;
  }
}

/* Round label click: cycle rounds (do not affect timer visual except label) */
roundLabel.addEventListener('click', (e)=>{
  roundIndex = (roundIndex + 1) % rounds.length;
  roundLabel.textContent = rounds[roundIndex];
  if(roundIndex === rounds.length - 1) roundLabel.classList.add('final'); else roundLabel.classList.remove('final');
  // NO timer pulse or layout change here (explicitly remove any added pulse)
});

/* Clean button (Lock style) */
function setCleanVisual(){
  if(cleanOn){
    cleanBtn.classList.remove('off'); cleanBtn.classList.add('clean');
    cleanBtn.classList.add('pressed'); cleanBtn.classList.add('locked'); cleanBtn.setAttribute('aria-pressed','true');
    cleanBtn.style.background = 'linear-gradient(145deg,#00FF00,#66ff66)'; cleanBtn.style.color='#000';
  } else {
    cleanBtn.classList.remove('clean'); cleanBtn.classList.add('off');
    cleanBtn.classList.remove('pressed'); cleanBtn.classList.remove('locked'); cleanBtn.setAttribute('aria-pressed','false');
    cleanBtn.style.background = 'linear-gradient(145deg,#808080,#cfcfcf)'; cleanBtn.style.color='#000';
  }
}
cleanBtn.addEventListener('click', ()=>{
  cleanOn = !cleanOn;
  setCleanVisual();
});

/* Bounce (撥ね矢) visual and behavior:
   OFF: bounceBtn text = "撥ね矢", resetBtn = "解　除"
   ON : bounceBtn text = "撥ね矢有➡" (pressed & locked), resetBtn = "撥矢／終了" (non-lock)
*/
function setBounceVisual(){
  if(bounceOn){
    bounceBtn.textContent = '撥ね矢有➡';
    bounceBtn.classList.add('pressed'); bounceBtn.classList.add('locked'); bounceBtn.classList.add('on');
    bounceBtn.setAttribute('aria-pressed','true');

    // reset becomes non-lock '撥矢／終了'
    resetBtn.textContent = '撥矢／終了';
    resetBtn.classList.remove('pressed','locked');
  } else {
    bounceBtn.textContent = '撥ね矢';
    bounceBtn.classList.remove('pressed','locked','on');
    bounceBtn.setAttribute('aria-pressed','false');

    resetBtn.textContent = '解　除';
  }
}

/* bounce toggle: only allowed while started OR when remaining === 0 (per spec)
   ----- 修正点1: 起動直後（timer 未開始）での「撥ね矢」タップ時のタイマー揺らぎを削除 ----- 
   以前は pulse を入れていたが、要望により「何もしない（ビジュアルヒントも不要）」にする。
*/
bounceBtn.addEventListener('click', ()=>{
  if(started || remaining === 0){
    bounceOn = !bounceOn;
    setBounceVisual();
    // When bounce turned ON during countdown, keep wakeLock until resolved
    if(bounceOn) enableWakeLock();
  } else {
    // DO NOTHING: no pulse, no layout shift — per spec (removed extraneous timer pulse)
    // intentionally empty to avoid any timer visual "揺らぎ"
  }
});

/* start/reset wiring */
startBtn.addEventListener('click', ()=>{ if(!timer) startTimer(); });
resetBtn.addEventListener('click', ()=>{ resetAction(); });

/* wallpaper handling: build list of available wallpaper-N.jpg */
function checkImageExists(src){ return new Promise(resolve=>{ const img = new Image(); img.onload = ()=>resolve(true); img.onerror = ()=>resolve(false); img.src = src; }); }

async function buildWallpaperList(){
  wallpapers = [];
  for(let i=1;i<=MAX_WALL;i++){
    const src = `wallpaper-${i}.jpg`;
    // small await to check existence
    try{
      const ok = await checkImageExists(src);
      if(ok) wallpapers.push(src);
    }catch(e){}
  }
  // restore saved index if valid
  const savedIndex = parseInt(localStorage.getItem('lastWallpaperIndex'));
  currentIndex = (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < wallpapers.length) ? savedIndex : 0;
}

/* setWallpaperByIndex */
function setWallpaperByIndex(idx){
  if(wallpapers.length===0){ updateWallNum(); return; }
  currentIndex = ((idx % wallpapers.length) + wallpapers.length) % wallpapers.length;
  if(!wallpaperOn){
    updateWallNum();
    try{ localStorage.setItem('lastWallpaperIndex', String(currentIndex)); }catch(e){}
    return;
  }
  const src = wallpapers[currentIndex];
  const img = new Image();
  img.onload = ()=>{ document.body.style.backgroundImage = `url('${src}'), linear-gradient(to bottom,var(--bg1),var(--bg2))`; document.body.style.backgroundColor = ''; updateWallNum(); try{ localStorage.setItem('lastWallpaperIndex', String(currentIndex)); }catch(e){} };
  img.src = src;
}

function updateWallNum() {
  if (!wallNumEl) return;

  if (!wallpaperOn) {        // Wallpaper OFF の場合は空白
    wallNumEl.textContent = '';
    wallNumEl.style.display = 'none';
    return;
  }

  const filename = wallpapers[currentIndex];
  const match = filename ? filename.match(/wallpaper-(\d+)\.jpg/i) : null;
  const num = match ? match[1] : "0";   // ファイル無 → 0
  wallNumEl.textContent = `-${num}-`;
  wallNumEl.style.display = '';         // 表示
}

/* apply wallpaper state (use currentIndex) */
function applyWallpaperState(){
  if(!wallpaperOn || wallpapers.length === 0){
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#000';
    updateWallNum();
  } else {
    document.body.style.backgroundColor = '';
    setWallpaperByIndex(currentIndex);
  }
}

/* wallpaper swipe */
let startX=0,startY=0;
document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive:true });
document.addEventListener('touchend', e => {
  if(wallpapers.length===0 || !wallpaperOn) return;
  const endX = e.changedTouches[0].clientX, endY = e.changedTouches[0].clientY;
  const diffX = endX - startX, diffY = endY - startY;
  if(Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)){
    currentIndex = (diffX < 0) ? (currentIndex + 1) % wallpapers.length : (currentIndex - 1 + wallpapers.length) % wallpapers.length;
    setWallpaperByIndex(currentIndex);
    try{ localStorage.setItem('lastWallpaperIndex', String(currentIndex)); }catch(e){}
  }
}, { passive:true });

/* Wallpaper toggle change */
wallToggle.addEventListener('change', async ()=>{
  wallpaperOn = wallToggle.checked;
  wallToggleLabel.textContent = wallpaperOn ? 'Wallpaper: ON' : 'Wallpaper: OFF';
  try{ localStorage.setItem('wallpaperOn', String(wallpaperOn)); }catch(e){}
  if(wallpaperOn){ try{ await applyWallpaperOn(); }catch(e){ applyWallpaperState(); } } else { applyWallpaperState(); }
});

/* small helper to apply wallpaper when toggled on — tries currentIndex then falls back */
async function applyWallpaperOn(){
  if(wallpapers.length === 0){
    await buildWallpaperList();
  }
  if(wallpapers.length === 0){
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#000';
    wallNumEl.textContent = '-0-';
    return false;
  }
  setWallpaperByIndex(currentIndex);
  return true;
}

/* Metronome: audio probing (tone-x.mp3) */
function ensureAudioCtx(){ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }

/* ----- 修正点2: WebAudio fallback を Ver.05.8 相当の安定した tone_1..tone_6 実装へ ----- */
/* probe for external audio (uses canplaythrough detection) */
async function audioFileExists(filename){
  try{
    const a = new Audio(filename);
    a.preload='auto';
    const ok = await new Promise(resolve=>{
      let t = setTimeout(()=>{ resolve(false); }, 500);
      a.addEventListener('canplaythrough', ()=>{ clearTimeout(t); resolve(true); }, { once:true });
      a.addEventListener('error', ()=>{ clearTimeout(t); resolve(false); }, { once:true });
      try{ a.load(); }catch(e){}
    });
    return ok;
  }catch(e){ return false; }
}

async function probeExternalTones(){
  for(let i=1;i<=6;i++){
    const id = `tone-${i}`;
    const fname = `${id}.mp3`;
    const ok = await audioFileExists(fname);
    externalToneAvailable[id] = ok;
    if(ok){ try{ const a = new Audio(fname); a.preload='auto'; externalAudioElements[id] = a; }catch(e){ externalAudioElements[id]=null; } }
    else externalAudioElements[id] = null;
  }
}

/* Ver.05.8 互換の WebAudio tone 実装（明示的関数で安定させる） */
function tone_1_play(){
  try{
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }catch(e){ console.warn('tone-1 error', e); }
}
function tone_2_play(){
  try{
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }catch(e){ console.warn('tone-2 error', e); }
}
function tone_3_play(){
  try{
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.03;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2 -1) * (1 - (i/bufferSize));
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1500;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    src.connect(bandpass).connect(gain).connect(audioCtx.destination);
    src.start(now);
    src.stop(now + 0.03);
  }catch(e){ console.warn('tone-3 error', e); }
}
function tone_4_play(){
  try{
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(2000, now);
    gainNode.gain.setValueAtTime(1.0, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }catch(e){ console.warn('tone-4 error', e); }
}
function tone_5_play(){
  try{
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1400, now);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }catch(e){ console.warn('tone-5 error', e); }
}
function tone_6_play(){
  try{
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, now);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    const high = audioCtx.createOscillator();
    high.type = "sine";
    high.frequency.setValueAtTime(2500, now);
    const highGain = audioCtx.createGain();
    highGain.gain.setValueAtTime(0.25, now);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(audioCtx.destination);
    high.connect(highGain).connect(audioCtx.destination);
    osc.start(now); high.start(now);
    osc.stop(now + 0.09); high.stop(now + 0.07);
  }catch(e){ console.warn('tone-6 error', e); }
}
 /* ----- end 修正2 ----- */

function playToneById(toneId){
  const useExternal = !!externalToneAvailable[toneId];
  if(useExternal){
    const baseAudio = externalAudioElements[toneId];
    if(baseAudio){
      try{
        const a = baseAudio.cloneNode();
        a.play().catch(()=>{});
        setTimeout(()=>{ try{ a.pause(); a.currentTime=0; }catch(e){} }, 1200);
        return;
      }catch(e){}
    }
  }
  // fallback to stable WebAudio tones (Ver.05.8 equivalent)
  switch(toneId){
    case "tone-1": tone_1_play(); break;
    case "tone-2": tone_2_play(); break;
    case "tone-3": tone_3_play(); break;
    case "tone-4": tone_4_play(); break;
    case "tone-5": tone_5_play(); break;
    case "tone-6": tone_6_play(); break;
    default: tone_1_play();
  }
}

/* metronome control */
function startMetronome(){ stopMetronome(); playToneById(selectedToneId); metronomeTimer = setInterval(()=>{ playToneById(selectedToneId); }, 1000); }
function stopMetronome(){ if(metronomeTimer){ clearInterval(metronomeTimer); metronomeTimer=null; } }

/* update metronome label */
function updateMetronomeLabel(){ metroToggleLabel.textContent = metroToggle.checked ? 'Metronome: ON/60bpm' : 'Metronome: OFF'; }

/* tone radio wiring & localStorage */
toneRadios.forEach(r=>{
  r.addEventListener('change', ()=>{
    if(r.checked){
      selectedToneId = `tone-${r.value}`;
      try{ localStorage.setItem('selectedMetronomeTone', selectedToneId); }catch(e){}
      if(metroToggle.checked) playToneById(selectedToneId);
    }
  });
});

/* metro toggle listener */
metroToggle.addEventListener('change', ()=>{
  updateMetronomeLabel();
  // per spec: metronome initial state should be OFF on app startup; here we just start/stop according to toggle
  if(metroToggle.checked){ startMetronome(); } else { stopMetronome(); }
});

/* small tap bounce visual for buttons (like Ver.05.8) */
function addTapBounce(elem){
  elem.addEventListener('pointerdown', ()=>{ elem.classList.add('pressed'); setTimeout(()=>{ if(!elem.classList.contains('locked')) elem.classList.remove('pressed'); }, 250); });
  elem.addEventListener('pointerup', ()=>{ if(!elem.classList.contains('locked')) elem.classList.remove('pressed'); });
  elem.addEventListener('pointercancel', ()=>{ if(!elem.classList.contains('locked')) elem.classList.remove('pressed'); });
  elem.addEventListener('pointerleave', ()=>{ if(!elem.classList.contains('locked')) elem.classList.remove('pressed'); });
}
addTapBounce(startBtn); addTapBounce(resetBtn); addTapBounce(cleanBtn); addTapBounce(bounceBtn);

/* =========================
   Ver.06.1: Time-tap handling
   =========================
   Spec:
   - Only active when initial state (remaining === 180 && !started)
   - Tap cycles: 3:08 -> 3:07 -> 3:06 -> 3:08 ...
   - Selected value displayed in lime; this value used as the start count when pressing "開始"
   - During countdown or any other state, tapping timeDiv does nothing
   - Reset clears selection (back to gold 3:00)
*/
function handleTimeTap(){
  // Only allow when NOT started and current visible time is initial 3:00 (remaining === 180)
  if(started) return;
  if(remaining !== 180) return;

  // Cycle selectionIndex
  if(selectionIndex === -1){
    selectionIndex = 0;
  } else {
    selectionIndex = (selectionIndex + 1) % startOptions.length;
  }
  selectedStartSeconds = startOptions[selectionIndex];

  // Show selected time in lime immediately
  timeDiv.textContent = formatTime(selectedStartSeconds);
  timeDiv.style.color = "#00ff00";
  timeDiv.style.textShadow = "0 0 20px #00ff00,2px 2px 5px rgba(0,0,0,0.5)";
}

// Support keyboard Enter/Space on focused timer for accessibility
/* NOTE: click on timeDiv has been intentionally disabled; overlay handles clicks */
timeDiv.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    handleTimeTap();
  }
});

/* Overlay click -> triggers the timer-initial-value change */
if(timeOverlay){
  timeOverlay.addEventListener('click', (e)=>{
    e.preventDefault();
    handleTimeTap();
  });
}

/* === tolk-♪ 機能追加のためのグローバル変数 === */
/* currentTolkAudio: タイトルから再生される tolk-*.mp3 の再生オブジェクト参照（存在しない場合 null） */
window.currentTolkAudio = null;

/* findTolkFile: 指定トーン番号（数字）を受け取り、tolk-x.mp3（固定6個）だけを確認して返す。
   仕様変更: ユー指示に従いファイル名はコメント無しの6個に固定：
     tolk-1.mp3 ... tolk-6.mp3
   戻り値: 見つかったファイル名の文字列、見つからなければ null
*/
async function findTolkFile(toneNum){
  if(!toneNum) return null;
  // Only check exact filename tolk-{x}.mp3 per user's request.
  const fname = `tolk-${toneNum}.mp3`;
  try{
    const ok = await audioFileExists(fname);
    return ok ? fname : null;
  }catch(e){
    return null;
  }
}

/* stopTolkAudio: 現在タイトル再生中の tolk 音声を停止・解放 */
function stopTolkAudio(){
  if(window.currentTolkAudio){
    try{ window.currentTolkAudio.pause(); window.currentTolkAudio.currentTime = 0; }catch(e){}
    window.currentTolkAudio = null;
  }
}

/* Title click handler: tone 選択に応じて tolk-x.mp3 を再生する（カウントダウン中は無効） */
mainTitle.addEventListener('click', async (ev)=>{
  try{
    // 無効条件: カウントダウン中は完全無視
    if(started) return;

    // Determine the selected tone number (from selectedToneId or radio state)
    let toneNum = null;
    // selectedToneId is like "tone-3"
    if(typeof selectedToneId === 'string' && /^tone-\d$/.test(selectedToneId)){
      toneNum = selectedToneId.split('-')[1];
    } else {
      // fallback: inspect radios
      const sel = document.querySelector('input[name="metronomeTone"]:checked');
      if(sel) toneNum = sel.value;
    }
    if(!toneNum) return;

    // First, stop any existing tolk audio
    stopTolkAudio();

    // Probe for the exact tolk-x.mp3 file only
    const found = await findTolkFile(toneNum);
    if(!found){
      // 何も見つからない → 無視（仕様通り）
      return;
    }

    // 再生開始
    const a = new Audio(found);
    a.preload = 'auto';
    window.currentTolkAudio = a;
    a.play().catch(()=>{ /* play が拒否された場合は無視 */ });

    // もし再生終了後に何かしたいならここにイベントを追加（今回は不要）
    a.addEventListener('ended', ()=>{
      // 再生完了後は参照をクリア（初期化）
      if(window.currentTolkAudio === a) window.currentTolkAudio = null;
    }, { once:true });
  }catch(e){
    // 何か問題があっても無視 — 既存動作に影響させない
    console.warn('tolk play error', e);
  }
});

/* init */
(async function init(){
  // basic reset
  document.body.style.backgroundImage = 'none';
  document.body.style.backgroundColor = '#000';
  remaining = 180;
  started = false;
  pulseFired = { "3_05": false, "3_00": false, "0_30": false, "0_10": false, "0_00": false };

  // Ensure selection cleared on startup
  selectedStartSeconds = null;
  selectionIndex = -1;

  // wallpaper: restore last ON/OFF + index if exists
  try{
    const savedOn = localStorage.getItem('wallpaperOn');
    wallpaperOn = (savedOn === null) ? false : (savedOn === 'true');
  }catch(e){ wallpaperOn = false; }
  const savedIndex = parseInt(localStorage.getItem('lastWallpaperIndex'));
  currentIndex = (!isNaN(savedIndex) && savedIndex >= 0) ? savedIndex : 0;

  // build wallpaper list
  await buildWallpaperList();

  // apply wallpaper toggle initial state
  const wallToggleElem = document.getElementById('wallToggle');
  if(wallToggleElem){
    wallToggleElem.checked = wallpaperOn;
    wallToggleLabel.textContent = wallpaperOn ? 'Wallpaper: ON' : 'Wallpaper: OFF';
    if(wallpaperOn) applyWallpaperState(); else { document.body.style.backgroundImage = 'none'; document.body.style.backgroundColor = '#000'; updateWallNum(); }
    wallToggleElem.addEventListener('change', async ()=>{
      wallpaperOn = wallToggleElem.checked;
      wallToggleLabel.textContent = wallpaperOn ? 'Wallpaper: ON' : 'Wallpaper: OFF';
      try{ localStorage.setItem('wallpaperOn', String(wallpaperOn)); }catch(e){}
      if(wallpaperOn) applyWallpaperState(); else { document.body.style.backgroundImage='none'; document.body.style.backgroundColor='#000'; wallNumEl.textContent='-0-'; }
    });
  }

  // Metronome: initial OFF per spec (do not restore previous ON/OFF)
  try{
    const metroSaved = localStorage.getItem('metronomeOn'); // we will ignore and start OFF
  }catch(e){}
  metroToggle.checked = false;
  updateMetronomeLabel();

  // restore selected tone if available
  try{
    const savedTone = localStorage.getItem('selectedMetronomeTone');
    if(savedTone && /^tone-\d$/.test(savedTone)) selectedToneId = savedTone;
  }catch(e){}
  const selVal = (selectedToneId.split('-')[1] || '1');
  const selectedRadio = document.getElementById(`tone-${selVal}`);
  if(selectedRadio) selectedRadio.checked = true;

  // probe external tones (non-blocking but awaited)
  await probeExternalTones();

  // set visuals for clean/bounce initial states
  setCleanVisual();
  setBounceVisual();

  // initial display
  updateDisplay();

  // address bar hide heuristic (scroll)
  function scrollToTop(){ try{ window.scrollTo(0,1); }catch(e){} }
  window.addEventListener('load', ()=>{ setTimeout(scrollToTop, 500); });
  window.addEventListener('orientationchange', ()=>{ setTimeout(scrollToTop, 500); });
})();


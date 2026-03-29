
const levels = [level1, level2, level3, level4, level5];


// --- Core State ---
let currentLevelIdx = 0;
let score = 0;
let isFiring = false;
let audioCtx = null;
let lastSonarTime = 0;
let particles = [];
let sonarRipples = [];

// Game Context Objects
let torpedo = { x: 0, y: 0, k: 0, b: 0, vt: 2.5 };
let enemy = { x: 0, y: 0, vx: 0, vy: 0, hit: false, revealTimer: 0 };

// --- DOM References ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const fireBtn = document.getElementById('fire-btn');
const inputK = document.getElementById('input-k'), inputB = document.getElementById('input-b');
const levelNumEl = document.getElementById('level-num'), scoreEl = document.getElementById('score');
const missionBrief = document.getElementById('mission-brief'), hintBox = document.getElementById('hint-box');
const solverPanel = document.getElementById('solver-panel');
const victoryModal = document.getElementById('victory-modal');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const openLabBtn = document.getElementById('open-lab-btn');
const closeLabBtn = document.getElementById('close-lab-btn');

// --- Initialization ---
function init() {
    setupLevel();
    animate();
    attachEvents();
    resize();
}

function attachEvents() {
    startBtn.addEventListener('click', () => { initAudio(); startOverlay.style.display = 'none'; playSound('click'); });
    fireBtn.addEventListener('click', handleFire);
    inputK.addEventListener('input', () => { playSound('click'); updatePrediction(); });
    inputB.addEventListener('input', () => { playSound('click'); updatePrediction(); });
    restartBtn.addEventListener('click', resetGame);
    openLabBtn.addEventListener('click', () => { if(window.TacticalLab) TacticalLab.show(); });
    window.addEventListener('resize', resize);
    window.checkFinalAnswer = (correct) => { if(correct) { alert("正解!"); resetGame(); } else alert("再度挑戦!"); };
}

// --- Audio Module ---
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); }

function playSound(type) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    switch(type) {
        case 'sonar': osc.frequency.setValueAtTime(800, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6); osc.start(); osc.stop(audioCtx.currentTime + 0.6); break;
        case 'echo': osc.frequency.setValueAtTime(1400, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3); break;
        case 'launch': osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.8); gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2); osc.start(); osc.stop(audioCtx.currentTime + 0.8); break;
        case 'explosion': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2); osc.start(); osc.stop(audioCtx.currentTime + 1.2); break;
        case 'win': [440, 554, 659, 880].forEach((f, i) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination); o.frequency.setValueAtTime(f, audioCtx.currentTime + i*0.1); g.gain.setValueAtTime(0.08, audioCtx.currentTime + i*0.1); o.start(audioCtx.currentTime + i*0.1); o.stop(audioCtx.currentTime + i*0.1 + 0.4); }); break;
        case 'fail': osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.5); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); osc.start(); osc.stop(audioCtx.currentTime + 0.5); break;
        default: osc.frequency.setValueAtTime(1000, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
}

// --- Visual Module (Particles) ---
class Particle {
    constructor(x, y, color) { this.x = x; this.y = y; this.vx = (Math.random()-0.5)*2.5; this.vy = (Math.random()-0.5)*2.5; this.life = 1.0; this.color = color; }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.012; }
    draw() { 
        const {cx, cy} = Physics.mathToCanvas(this.x, this.y, canvas.width, canvas.height); 
        ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; 
    }
}

// --- Level Logic ---
function setupLevel() {
    const config = levels[currentLevelIdx];
    levelNumEl.innerText = config.id;
    scoreEl.innerText = score;
    missionBrief.innerHTML = config.brief;
    hintBox.innerHTML = config.hint;
    
    // Reset inputs
    inputK.value = ""; inputB.value = "";
    isFiring = false;
    particles = [];
    sonarRipples = [];
    
    // Set Level State
    enemy = { ...config.enemy, hit: false, revealTimer: 0 };
    torpedo = { ...config.torpedo, y: 0 };
    
    solverPanel.style.display = config.id > 1 ? 'block' : 'none';
    
    // Show Lab button only on Mission 05
    if (config.id === 5) {
        openLabBtn.style.display = 'block';
    } else {
        openLabBtn.style.display = 'none';
    }

    updatePrediction();
}

function handleFire() {
    initAudio(); if (isFiring) return;
    const k = parseFloat(inputK.value), b = parseFloat(inputB.value);
    if (isNaN(k) || isNaN(b)) return alert("数値を入力してください。");
    
    torpedo.k = k; torpedo.b = b; torpedo.x = 0; torpedo.y = b;
    isFiring = true; 
    playSound('launch');
}

function nextLevel() {
    currentLevelIdx++;
    if (currentLevelIdx >= levels.length) { victoryModal.style.display = 'flex'; return; }
    setupLevel();
}

function endFire(hit) {
    isFiring = false;
    if (hit) {
        score += 100; scoreEl.innerText = score; playSound('win');
        nextLevel();
    } else {
        playSound('fail'); alert("迎撃失敗！計算し直してください。");
        // Reset torpedo to start
        torpedo.x = 0; torpedo.y = torpedo.b;
        enemy.x = levels[currentLevelIdx].enemy.initialX;
        enemy.y = levels[currentLevelIdx].enemy.initialY;
    }
}

function resetLevel() {
    const config = levels[currentLevelIdx];
    torpedo.x = 0; enemy.hit = false;
    enemy.x = config.enemy.initialX; enemy.y = config.enemy.initialY;
    enemy.revealTimer = 0; particles = [];
}

function resetGame() {
    currentLevelIdx = 0; score = 0; 
    victoryModal.style.display = 'none'; 
    startOverlay.style.display = 'flex';
    setupLevel();
}

// --- Prediction Logic ---
function updatePrediction() {
    const k = parseFloat(inputK.value) || 0, b = parseFloat(inputB.value) || 0;
    const config = levels[currentLevelIdx];
    const statusEl = document.getElementById('solve-status');
    const timeEl = document.getElementById('stat-time');
    
    if (config.isAdvancedPhysics) {
        const vx = Physics.calculateVx(config.torpedo.vt, k);
        const vy = Physics.calculateVy(vx, k);
        
        document.getElementById('stat-vx').innerText = vx.toFixed(2);
        document.getElementById('stat-vy').innerText = vy.toFixed(2);
        
        const dx = config.enemy.initialX - 0; // Torpedo always starts at x=0
        const relVx = vx - config.enemy.vx;
        const time = Physics.calculateCatchTime(dx, relVx);
        
        if (time === Infinity || time > 1000) {
            timeEl.innerText = "∞"; statusEl.innerText = "速度不足！";
        } else {
            timeEl.innerText = time.toFixed(1);
            const enemyY = config.enemy.initialY + config.enemy.vy * time;
            const torpedoY = b + vy * time;
            if (Math.abs(enemyY - torpedoY) < 4.8) {
                statusEl.innerText = "迎撃可能領域"; statusEl.classList.remove('error');
            } else {
                statusEl.innerText = "予測位置ズレ"; statusEl.classList.add('error');
            }
        }
    } else {
        statusEl.innerText = "軌道計算中...";
    }
}

// --- Rendering Loop ---
function animate() {
    const config = levels[currentLevelIdx];
    const dt = 0.4;
    
    // Sonar ripples
    const now = Date.now();
    if (now - lastSonarTime > 4000) { 
        sonarRipples.push({ x: 0, y: torpedo.b, r: 0 }); 
        playSound('sonar'); lastSonarTime = now; 
    }
    
    // Physics Update
    if (isFiring) {
        if (config.isAdvancedPhysics) {
            const vx = Physics.calculateVx(config.torpedo.vt, torpedo.k);
            torpedo.x += vx * dt;
            torpedo.y += Physics.calculateVy(vx, torpedo.k) * dt;
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;
        } else {
            torpedo.x += 0.8; 
            torpedo.y = torpedo.k * torpedo.x + torpedo.b;
        }
        
        if (Physics.checkHit(torpedo.x, torpedo.y, enemy.x, enemy.y)) {
            isFiring = false; enemy.hit = true; playSound('explosion');
            for(let i=0; i<60; i++) particles.push(new Particle(enemy.x, enemy.y, i%2?'#f97316':'#ef4444'));
            setTimeout(() => endFire(true), 1200);
        } else if (torpedo.x > 100 || torpedo.y > 60 || torpedo.y < 0) {
            endFire(false);
        }
    }
    
    // Update sonar and particles
    sonarRipples.forEach((r, i) => {
        r.r += 0.65;
        const {cx: scx, cy: scy} = Physics.mathToCanvas(r.x, r.y, canvas.width, canvas.height);
        const {cx: ecx, cy: ecy} = Physics.mathToCanvas(enemy.x, enemy.y, canvas.width, canvas.height);
        const distPX = Math.sqrt((scx - ecx)**2 + (scy - ecy)**2);
        
        // Detection logic
        if (Math.abs(r.r * 8 - distPX) < 6 && enemy.revealTimer <= 0) { 
            enemy.revealTimer = 120; 
            playSound('echo'); 
        }
        if (r.r > 150) sonarRipples.splice(i, 1);
    });
    if (enemy.revealTimer > 0) enemy.revealTimer--;
    particles.forEach((p, i) => { p.update(); if (p.life <= 0) particles.splice(i, 1); });
    
    // --- DRAWING ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    // Draw Sonar
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)'; ctx.lineWidth = 2;
    sonarRipples.forEach(r => {
        const {cx, cy} = Physics.mathToCanvas(r.x, r.y, canvas.width, canvas.height);
        ctx.beginPath(); ctx.arc(cx, cy, r.r*8, 0, Math.PI*2); ctx.stroke();
    });
    
    drawSubmarine();
    if (!enemy.hit) drawEnemy();
    drawPredictedPath();
    
    if (isFiring) {
        const t = Physics.mathToCanvas(torpedo.x, torpedo.y, canvas.width, canvas.height);
        ctx.save();
        ctx.shadowBlur = 15; ctx.shadowColor = '#4ade80';
        ctx.fillStyle = '#4ade80'; ctx.beginPath();
        ctx.ellipse(t.cx, t.cy, 8, 3, Math.atan(torpedo.k), 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
    
    particles.forEach(p => p.draw());
    requestAnimationFrame(animate);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 100; i += 10) {
        const {cx} = Physics.mathToCanvas(i, 0, canvas.width, canvas.height);
        ctx.beginPath(); ctx.moveTo(cx, Physics.MARGIN); ctx.lineTo(cx, canvas.height - Physics.MARGIN); ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'; ctx.font = '10px JetBrains Mono'; ctx.fillText(i, cx-5, canvas.height - Physics.MARGIN + 15);
    }
    for (let i = 0; i <= 60; i += 10) {
        const {cy} = Physics.mathToCanvas(0, i, canvas.width, canvas.height);
        ctx.beginPath(); ctx.moveTo(Physics.MARGIN, cy); ctx.lineTo(canvas.width - Physics.MARGIN, cy); ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)'; ctx.fillText(i, Physics.MARGIN-25, cy+5);
    }
}

function drawSubmarine() {
    const sub = Physics.mathToCanvas(0, torpedo.b, canvas.width, canvas.height); 
    ctx.save();
    ctx.shadowBlur = 10; ctx.shadowColor = '#0ea5e9';
    ctx.fillStyle = '#1e293b';
    
    // Hull
    ctx.beginPath(); ctx.moveTo(sub.cx - 25, sub.cy); 
    ctx.quadraticCurveTo(sub.cx - 25, sub.cy - 8, sub.cx - 10, sub.cy - 8); ctx.lineTo(sub.cx + 15, sub.cy - 8);
    ctx.quadraticCurveTo(sub.cx + 25, sub.cy - 8, sub.cx + 25, sub.cy); ctx.quadraticCurveTo(sub.cx + 25, sub.cy + 8, sub.cx + 15, sub.cy + 8);
    ctx.lineTo(sub.cx - 10, sub.cy + 8); ctx.quadraticCurveTo(sub.cx - 25, sub.cy + 8, sub.cx - 25, sub.cy); ctx.fill();
    
    // Sail
    ctx.fillRect(sub.cx - 5, sub.cy - 16, 12, 10);
    // Detail lines
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sub.cx - 15, sub.cy - 2); ctx.lineTo(sub.cx + 15, sub.cy - 2); ctx.stroke();
    // Periscope
    ctx.beginPath(); ctx.moveTo(sub.cx + 2, sub.cy - 16); ctx.lineTo(sub.cx + 2, sub.cy - 24); ctx.lineTo(sub.cx + 6, sub.cy - 24); ctx.stroke();
    ctx.restore();
}

function drawEnemy() {
    // Enemy is only visible when scanned OR after hit
    if (enemy.revealTimer <= 0 && !enemy.hit && !isFiring) return;
    
    const en = Physics.mathToCanvas(enemy.x, enemy.y, canvas.width, canvas.height);
    const alpha = enemy.hit ? 0.5 : Math.min(1, enemy.revealTimer / 20);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 15; ctx.shadowColor = '#ef4444';
    
    // Hull
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(en.cx - 30, en.cy);
    ctx.lineTo(en.cx + 30, en.cy);
    ctx.lineTo(en.cx + 26, en.cy - 10);
    ctx.lineTo(en.cx - 20, en.cy - 10);
    ctx.closePath();
    ctx.fill();
    
    // Superstructure
    ctx.fillStyle = '#475569';
    ctx.fillRect(en.cx - 10, en.cy - 18, 15, 8);
    ctx.fillRect(en.cx + 5, en.cy - 14, 10, 4);
    
    // Waterline / Glow
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(en.cx - 28, en.cy - 1, 56, 2);
    
    if (enemy.revealTimer > 0) {
        ctx.fillStyle = '#10b981'; ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText(`TARGET: ALPHA-9`, en.cx - 35, en.cy + 18);
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`POS: ${Math.round(enemy.x)}, ${Math.round(enemy.y)}`, en.cx - 35, en.cy + 30);
    }
    ctx.restore();
}

function drawPredictedPath() {
    if (isFiring) return;
    const k = parseFloat(inputK.value), b = parseFloat(inputB.value);
    if (isNaN(k) || isNaN(b)) return;
    ctx.save(); 
    ctx.setLineDash([8, 4]); 
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'; 
    ctx.lineWidth = 2;
    const start = Physics.mathToCanvas(0, b, canvas.width, canvas.height);
    const end = Physics.mathToCanvas(100, k * 100 + b, canvas.width, canvas.height);
    ctx.beginPath(); ctx.moveTo(start.cx, start.cy); ctx.lineTo(end.cx, end.cy); ctx.stroke(); 
    ctx.restore();
}

function resize() { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }

// Entry point
init();

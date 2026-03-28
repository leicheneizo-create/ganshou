const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const fireBtn = document.getElementById('fire-btn');
const inputK = document.getElementById('input-k');
const inputB = document.getElementById('input-b');
const levelNumEl = document.getElementById('level-num');
const scoreEl = document.getElementById('score');
const missionBrief = document.getElementById('mission-brief');
const hintBox = document.getElementById('hint-box');
const solverPanel = document.getElementById('solver-panel');
const eqEnemy = document.getElementById('eq-enemy');

// Game State
let currentLevel = 1;
let score = 0;
let isFiring = false;
let predictedPath = { k: 0, b: 0, visible: false };
let torpedo = { x: 0, y: 0, k: 0, b: 0, progress: 0 };
let enemy = { x: 80, y: 40, k: 0, b: 0, speed: 0, initialX: 80 };
let animations = [];

// Constants
const MARGIN = 40;
const GRID_SIZE = 50;

// Initialize Canvas
function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    draw();
}

window.addEventListener('resize', resize);
resize();

// Coordinate Mapping
function canvasToMath(cx, cy) {
    const unitX = (canvas.width - 2 * MARGIN) / 100;
    const unitY = (canvas.height - 2 * MARGIN) / 60;
    return {
        x: (cx - MARGIN) / unitX,
        y: (canvas.height - MARGIN - cy) / unitY
    };
}

function mathToCanvas(mx, my) {
    const unitX = (canvas.width - 2 * MARGIN) / 100;
    const unitY = (canvas.height - 2 * MARGIN) / 60;
    return {
        cx: mx * unitX + MARGIN,
        cy: canvas.height - MARGIN - (my * unitY)
    };
}

// Draw Grid and Scene
function drawGrid() {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= 100; i += 10) {
        const { cx } = mathToCanvas(i, 0);
        ctx.beginPath();
        ctx.moveTo(cx, MARGIN);
        ctx.lineTo(cx, canvas.height - MARGIN);
        ctx.stroke();
        
        ctx.fillStyle = '#475569';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(i, cx - 5, canvas.height - MARGIN + 15);
    }

    // Horizontal lines
    for (let i = 0; i <= 60; i += 10) {
        const { cy } = mathToCanvas(0, i);
        ctx.beginPath();
        ctx.moveTo(MARGIN, cy);
        ctx.lineTo(canvas.width - MARGIN, cy);
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.fillText(i, MARGIN - 25, cy + 5);
    }

    // Axes
    ctx.strokeStyle = '#4db8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, MARGIN);
    ctx.lineTo(MARGIN, canvas.height - MARGIN);
    ctx.lineTo(canvas.width - MARGIN, canvas.height - MARGIN);
    ctx.stroke();
}

function drawSubmarine() {
    const { cx, cy } = mathToCanvas(0, torpedo.b || 0);
    
    // Glowing aura
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4db8ff';
    
    ctx.fillStyle = '#4db8ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Label
    ctx.shadowBlur = 0;
    ctx.font = '12px Outfit';
    ctx.fillText("潜水艦 (0, " + (inputB.value || 0) + ")", cx - 20, cy - 15);
}

function drawEnemy() {
    const { cx, cy } = mathToCanvas(enemy.x, enemy.y);
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3e3e';
    ctx.fillStyle = '#ff3e3e';
    
    // Draw "ship" shape
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.lineTo(cx + 10, cy - 8);
    ctx.lineTo(cx - 10, cy - 8);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillText("目標 " + (currentLevel === 2 ? "(ターゲット)" : ""), cx - 20, cy - 15);
    
    if (currentLevel === 2) {
        // Draw enemy path line (faint)
        ctx.strokeStyle = 'rgba(255, 62, 62, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const start = mathToCanvas(0, enemy.b);
        const end = mathToCanvas(100, 100 * enemy.k + enemy.b);
        ctx.moveTo(start.cx, start.cy);
        ctx.lineTo(end.cx, end.cy);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawTorpedo() {
    if (predictedPath.visible && !isFiring) {
        ctx.strokeStyle = 'rgba(77, 184, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const start = mathToCanvas(0, predictedPath.b);
        const end = mathToCanvas(100, 100 * predictedPath.k + predictedPath.b);
        ctx.moveTo(start.cx, start.cy);
        ctx.lineTo(end.cx, end.cy);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (!isFiring) return;

    const { cx, cy } = mathToCanvas(torpedo.x, torpedo.y);
    
    // Path trail
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const start = mathToCanvas(0, torpedo.b);
    ctx.moveTo(start.cx, start.cy);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Torpedo head
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff41';
    ctx.fillStyle = '#00ff41';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawSubmarine();
    drawEnemy();
    drawTorpedo();
}

// Game Logic
function update() {
    if (isFiring) {
        torpedo.x += 1; // Speed x
        torpedo.y = torpedo.k * torpedo.x + torpedo.b;

        if (currentLevel === 2) {
            enemy.x += enemy.speed; // Enemy also moves
            enemy.y = enemy.k * enemy.x + enemy.b;
        }

        // Check bounds
        if (torpedo.x > 100 || torpedo.y > 60 || torpedo.y < 0) {
            endFire(false);
        }

        // Collision detection
        const dx = torpedo.x - enemy.x;
        const dy = torpedo.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
            endFire(true);
        }
    }
    draw();
    requestAnimationFrame(update);
}

function endFire(hit) {
    isFiring = false;
    if (hit) {
        score += 100;
        scoreEl.innerText = score;
        alert("命中！正確な計算です。");
        nextLevel();
    } else {
        alert("失敗！k 修正または b の設定を確認してください。");
        resetLevel();
    }
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > 2) {
        alert("ミッション完了！航海における線形代数の基礎をマスターしました！");
        currentLevel = 1;
        score = 0;
    }
    setupLevel();
}

function setupLevel() {
    levelNumEl.innerText = currentLevel;
    torpedo.x = 0;
    torpedo.progress = 0;
    inputK.value = "";
    inputB.value = "10";

    if (currentLevel === 1) {
        enemy = { x: 80, y: 40, k: 0, b: 40, speed: 0, initialX: 80 };
        missionBrief.innerText = "レベル 1：静止目標。座標 (80, 40) で巡航中の敵艦を撃破せよ。y = kx + b の軌道を計算してください。ヒント：潜水艦の初期深度 b から目標までの傾き k を (y2-y1)/(x2-x1) で求めてみましょう。";
        solverPanel.style.display = 'none';
        hintBox.innerHTML = "<p><strong>知識点：</strong>y = kx + b において、b は初期深度（切片）、k は 1 進むごとの深さの変化（傾き）を表します。</p>";
    } else if (currentLevel === 2) {
        // Enemy moves slowly down and right
        enemy = { x: 30, y: 50, k: -0.3, b: 59, speed: 0.2, initialX: 30 };
        missionBrief.innerText = "レベル 2：動的迎撃。敵艦の軌道方程式は y = -0.3x + 59 です。この直線と交差する軌道を設定し、「衝突の瞬間」を狙い撃ってください。連立方程式の解を求めるのが鍵となります。";
        solverPanel.style.display = 'block';
        eqEnemy.innerText = "y = -0.3x + 59";
        hintBox.innerHTML = "<p><strong>知識点：</strong>2つの関数の y が等しいとき、その直線の交点が衝突地点となります。連立方程式を解いて、最適な (x, y) を特定しましょう。</p>";
    }
}

function resetLevel() {
    torpedo.x = 0;
    if (currentLevel === 2) {
        enemy.x = 30;
        enemy.y = 50;
    }
}

fireBtn.addEventListener('click', () => {
    if (isFiring) return;
    
    const k = parseFloat(inputK.value);
    const b = parseFloat(inputB.value);
    
    if (isNaN(k) || isNaN(b)) {
        alert("有効な k と b の値を入力してください！");
        return;
    }
    
    torpedo.k = k;
    torpedo.b = b;
    torpedo.x = 0;
    torpedo.y = b;
    isFiring = true;
    predictedPath.visible = false;
});

const updatePrediction = () => {
    predictedPath.k = parseFloat(inputK.value) || 0;
    predictedPath.b = parseFloat(inputB.value) || 10;
    predictedPath.visible = !isNaN(parseFloat(inputK.value)) || !isNaN(parseFloat(inputB.value));
};

inputK.addEventListener('input', updatePrediction);
inputB.addEventListener('input', updatePrediction);

// Start
setupLevel();
update();

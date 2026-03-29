/**
 * Tactical Laboratory Module
 * Handles the interactive physics simulation for slope and velocity.
 */

const TacticalLab = {
    modal: null,
    canvas: null,
    ctx: null,
    sliderK: null,
    kVal: null,
    
    // Animation state
    k: 1.0,
    vt: 2.5,
    simTime: 0,
    isDemosRunning: false,
    
    init() {
        this.modal = document.getElementById('lab-modal');
        this.canvas = document.getElementById('lab-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.sliderK = document.getElementById('lab-slider-k');
        this.kVal = document.getElementById('lab-k-val');
        
        // UI Elements
        const closeBtn = document.getElementById('close-lab-btn');
        const demoBtn = document.getElementById('lab-demo-btn');
        const resetBtn = document.getElementById('lab-reset-btn');
        
        // Events
        this.sliderK.addEventListener('input', (e) => {
            this.k = parseFloat(e.target.value);
            this.kVal.innerText = this.k.toFixed(1);
            this.updateOutputs();
        });
        
        closeBtn.addEventListener('click', () => this.hide());
        demoBtn.addEventListener('click', () => this.toggleDemo());
        resetBtn.addEventListener('click', () => this.reset());
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.updateOutputs();
        this.animate();
    },

    show() {
        this.modal.style.display = 'flex';
        this.resize();
        if (typeof playSound === 'function') playSound('sonar');
    },

    hide() {
        this.modal.style.display = 'none';
        this.isDemosRunning = false;
    },

    reset() {
        this.k = 1.0;
        this.sliderK.value = 1.0;
        this.kVal.innerText = "1.0";
        this.simTime = 0;
        this.isDemosRunning = false;
        this.updateOutputs();
    },

    toggleDemo() {
        this.isDemosRunning = !this.isDemosRunning;
        this.simTime = 0;
        if (this.isDemosRunning && typeof playSound === 'function') playSound('launch');
    },

    updateOutputs() {
        const vx = Physics.calculateVx(this.vt, this.k);
        const vy = Physics.calculateVy(vx, this.k);
        
        const vxBar = document.getElementById('lab-vx-bar');
        const vyBar = document.getElementById('lab-vy-bar');
        
        // Percentages relative to vt
        const vxPct = (vx / this.vt) * 100;
        const vyPct = (vy / this.vt) * 100;
        
        vxBar.style.width = `${vxPct}%`;
        vyBar.style.width = `${vyPct}%`;
        
        document.getElementById('lab-vx-val').innerText = `${vx.toFixed(2)} unit/s (${vxPct.toFixed(0)}%)`;
        document.getElementById('lab-vy-val').innerText = `${vy.toFixed(2)} unit/s (${vyPct.toFixed(0)}%)`;
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    },

    animate() {
        this.draw();
        if (this.isDemosRunning) {
            this.simTime += 0.05;
            if (this.simTime > 15) this.simTime = 0;
        }
        requestAnimationFrame(() => this.animate());
    },

    draw() {
        if (!this.ctx || this.modal.style.display === 'none') return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const centerX = w * 0.2;
        const centerY = h * 0.6;
        const scale = 120;

        ctx.clearRect(0, 0, w, h);
        
        // Draw Grid
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.05)';
        ctx.lineWidth = 1;
        for(let i=0; i<w; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
        for(let j=0; j<h; j+=40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }

        // --- Simplified Analysis Area ---
        // Draw the "Ground"
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(w, centerY); ctx.stroke();

        // Draw the "Path"
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + 200, centerY - 200 * this.k);
        ctx.stroke();

        // Slope highlight
        ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + 200, centerY);
        ctx.lineTo(centerX + 200, centerY - 200 * this.k);
        ctx.closePath();
        ctx.fill();

        // Indicators
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Outfit';
        ctx.fillText(`現在の傾き k = ${this.k.toFixed(1)}`, centerX + 10, centerY - 200 * this.k - 20);

        // --- Live Demo Area ---
        if (this.isDemosRunning) {
            this.drawDemoTorpedo(ctx, w * 0.6, h * 0.5, this.k, '#0ea5e9', '現在の設定');
            this.drawDemoTorpedo(ctx, w * 0.6, h * 0.3, 0, '#94a3b8', '水平移動 (k=0)');
        }
    },

    drawDemoTorpedo(ctx, startX, startY, k, color, label) {
        const vx = Physics.calculateVx(this.vt, k);
        const vy = Physics.calculateVy(vx, k);
        const px = startX + vx * this.simTime * 15;
        const py = startY - vy * this.simTime * 15;

        // Trace
        ctx.strokeStyle = color; ctx.globalAlpha = 0.2; ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(startX + 150, startY - 150*k); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1.0;

        // Torpedo
        ctx.fillStyle = color;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-Math.atan(k));
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // label
        ctx.fillStyle = color; ctx.font = '10px JetBrains Mono';
        ctx.fillText(label, px - 20, py + 15);
    },

    drawArrowhead(ctx, x, y, angle, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.fill();
        ctx.restore();
    }
};

// Initialize when the DOM is ready (called from main.js or here)
window.addEventListener('DOMContentLoaded', () => TacticalLab.init());

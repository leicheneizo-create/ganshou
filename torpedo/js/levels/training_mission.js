const level1 = {
    id: 1,
    name: "MISSION 01: 整点命中",
    brief: "ターゲットは坐标(40, 50)に停泊。初期深度 <b>b = 10</b> から命中させるための整数 <b>k</b> を求めよ。",
    hint: "<b>数学ヒント:</b><br>y = kx + b に(40, 50)を代入。<br>50 = k(40) + 10 → 40 = 40k。<br>答えはシンプルな<b>整数</b>です。",
    isAdvancedPhysics: false, // Uses simple frame-based step
    torpedo: { x: 0, b: 0, k: 0, vx: 0.8 },
    enemy: { x: 40, y: 50, vx: 0, vy: 0, initialX: 40, initialY: 50 }
};

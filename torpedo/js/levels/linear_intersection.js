const level3 = {
    id: 3,
    name: "MISSION 03: 方程式の交点",
    brief: "敵艦は y = -1x + 70 を移動中。潜水艦(0, 10)から整数 <b>k</b> で発射し、整点の交点(30, 40)で撃破せよ。",
    hint: "<b>数学ヒント:</b><br>連立方程式の解を狙います。<br>1x + 10 = -1x + 70 を解くと x = 30。<br>このとき命中する <b>k</b> は？",
    isAdvancedPhysics: true,
    torpedo: { x: 0, b: 0, k: 0, vt: 3.0 },
    enemy: { x: 10, y: 60, vx: 0.16, vy: -0.16, initialX: 10, initialY: 60 }
};

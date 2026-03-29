const level5 = {
    id: 5,
    name: "MISSION 05: 斜率と速度の関係",
    brief: "魚雷の全速力は一定です。<b>斜率 k</b> が大きいほど、水平速度 <b>Vx</b> は遅くなります。k=2, b=0 を選択し、(20, 40)で迎撃せよ！",
    hint: "<b>数学ヒント:</b><br>Vx = Vt / √(1+k²)<br>k=2 のとき、Vx=1, Vy=2 となります。",
    isAdvancedPhysics: true,
    torpedo: { x: 0, b: 0, k: 0, vt: 2.236 },
    enemy: { x: 10, y: 40, vx: 0.5, vy: 0, initialX: 10, initialY: 40 }
};

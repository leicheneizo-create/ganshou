const level2 = {
    id: 2,
    name: "MISSION 02: 速度の効果",
    brief: "エンジンを強化しました。ターゲットは逃走中ですが、<b>高速魚雷</b>なら短い距離と時間で追い越せます。k=1, b=10 で迎撃！",
    hint: "<b>速度のヒント:</b><br>速い魚雷ほど、敵が逃げる前に命中します。<br>到達時間(Time)が短くなることを確認してください。",
    isAdvancedPhysics: true,
    torpedo: { x: 0, b: 0, k: 0, vt: 4.0 }, // Total speed for vt calculations
    enemy: { x: 40, y: 50, vx: 0.3, vy: 0, initialX: 40, initialY: 50 }
};

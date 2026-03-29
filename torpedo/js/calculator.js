/**
 * Mathematical calculations and physics logic for the Torpedo Simulation
 */

const Physics = {
    MARGIN: 40,
    WORLD_X: 100,
    WORLD_Y: 60,

    /**
     * Map mathematical coordinates to canvas pixel coordinates
     */
    mathToCanvas(mx, my, canvasWidth, canvasHeight) {
        const unitX = (canvasWidth - 2 * this.MARGIN) / this.WORLD_X, 
              unitY = (canvasHeight - 2 * this.MARGIN) / this.WORLD_Y;
        return { 
            cx: mx * unitX + this.MARGIN, 
            cy: canvasHeight - this.MARGIN - (my * unitY) 
        };
    },

    /**
     * Calculate Vx component given total speed (vt) and slope (k)
     * formula: vx = vt / sqrt(1 + k^2)
     */
    calculateVx(vt, k) {
        return vt / Math.sqrt(1 + k * k);
    },

    /**
     * Calculate Vy component given vx and slope (k)
     */
    calculateVy(vx, k) {
        return k * vx;
    },

    /**
     * Calculate how long it takes to close a horizontal distance (dx)
     * with relative speed (relVx)
     */
    calculateCatchTime(dx, relVx) {
        if (relVx <= 0) return Infinity;
        return dx / relVx;
    },

    /**
     * Check if two points are within hitting distance
     */
    checkHit(x1, y1, x2, y2, threshold = 4.8) {
        const distSq = (x1 - x2) ** 2 + (y1 - y2) ** 2;
        return Math.sqrt(distSq) < threshold;
    },

    /**
     * Linear interpolation for target movement along a slope
     */
    lerpTargetY(initialY, speedY, xMoved, speedX) {
        if (speedX === 0) return initialY;
        return initialY + speedY * (xMoved / speedX);
    }
};

// fieldEffect.js

export default class FieldEffect {
    constructor(game, caster, position, range, duration, damagePerTick, slowFactor) {
        this.game = game;
        this.caster = caster;
        this.position = { x: position.x, y: position.y };
        this.range = range;
        this.duration = duration * 60; // 秒をフレームに変換 (例: 5秒 * 60フレーム/秒)
        this.damagePerTick = damagePerTick;
        this.slowFactor = slowFactor;
        this.tickTimer = 0;
        this.tickInterval = 60; // 1秒ごとにダメージを与える (60フレーム)
        this.affectedEnemies = new Set();
    }

    update(enemies) {
        this.duration--;

        // 範囲内にいる敵を検出
        const enemiesInRange = enemies.filter(enemy => {
            const distance = Math.hypot(this.position.x - enemy.position.x, this.position.y - enemy.position.y);
            return distance <= this.range;
        });

        // 毎フレーム、範囲内の敵に速度低下を適用
        enemiesInRange.forEach(enemy => {
            if (enemy.speed !== enemy.originalSpeed * this.slowFactor) {
                enemy.speed = enemy.originalSpeed * this.slowFactor;
                // ダメージテキストは表示しない
            }
        });

        // 範囲外に出た敵の速度を元に戻す
        enemies.forEach(enemy => {
            if (!enemiesInRange.includes(enemy) && enemy.speed !== enemy.originalSpeed) {
                enemy.speed = enemy.originalSpeed;
            }
        });

        this.tickTimer++;
        if (this.tickTimer >= this.tickInterval) {
            this.tickTimer = 0;
            // 毎秒ダメージを適用
            enemiesInRange.forEach(enemy => {
                const damage = Math.max(1, this.damagePerTick - enemy.magicDefense);
                enemy.takeDamage(damage);
                this.game.addMessage(`${this.caster.name} のフィールド効果で ${enemy.name} に ${damage.toFixed(1)} ダメージを与えた！`);
            });
        }
    }

    draw(ctx) {
        // フィールド効果の円を描画（デバッグ用）
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.range, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 43, 226, ${this.duration > 60 ? 0.3 : (this.duration / 60) * 0.3})`;
        ctx.fill();
    }
}
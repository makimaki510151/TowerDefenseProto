// fieldEffect.js
export default class FieldEffect {
    constructor(game, caster, position, range, duration, damagePerTick, slowFactor, type, width, height) {
        this.game = game;
        this.caster = caster;
        this.position = { x: position.x, y: position.y };
        this.range = range;
        this.duration = duration * 60;
        this.damagePerTick = damagePerTick;
        this.slowFactor = slowFactor;
        this.tickTimer = 0;
        this.tickInterval = 60;
        this.affectedEnemies = new Set();

        // ★追加: 範囲タイプと長方形のサイズを保存
        this.type = type;
        this.width = width;
        this.height = height;
    }

    update(enemies) {
        this.duration--;

        let enemiesInRange;

        // ★範囲タイプに応じて敵の検出方法を変更
        if (this.type === 'rectangle') {
            const left = this.position.x - this.width;
            const right = this.position.x;
            const top = this.position.y - this.height / 2;
            const bottom = this.position.y + this.height / 2;
            
            enemiesInRange = enemies.filter(enemy => {
                const enemyCenterX = enemy.position.x + 20;
                const enemyCenterY = enemy.position.y + 20;
                return enemyCenterX >= left && enemyCenterX <= right &&
                       enemyCenterY >= top && enemyCenterY <= bottom;
            });
        } else {
            enemiesInRange = enemies.filter(enemy => {
                const distance = Math.hypot(this.position.x - enemy.position.x, this.position.y - enemy.position.y);
                return distance <= this.range;
            });
        }

        enemiesInRange.forEach(enemy => {
            if (enemy.speed !== enemy.originalSpeed * this.slowFactor) {
                enemy.speed = enemy.originalSpeed * this.slowFactor;
            }
        });

        enemies.forEach(enemy => {
            if (!enemiesInRange.includes(enemy) && enemy.speed !== enemy.originalSpeed) {
                enemy.speed = enemy.originalSpeed;
            }
        });

        this.tickTimer++;
        if (this.tickTimer >= this.tickInterval) {
            this.tickTimer = 0;
            enemiesInRange.forEach(enemy => {
                const damage = Math.max(1, this.damagePerTick - enemy.magicDefense);
                enemy.takeDamage(damage);
                this.game.addMessage(`${this.caster.name} のフィールド効果で ${enemy.name} に ${damage.toFixed(1)} ダメージを与えた！`);
            });
        }
    }

    draw(ctx) {
        // ★範囲タイプに応じて描画方法を変更
        if (this.type === 'rectangle') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            // 長方形の左上座標を計算して描画（左方向へ伸びるように）
            const x = this.position.x - this.width;
            const y = this.position.y - this.height / 2;
            ctx.fillRect(x, y, this.width, this.height);
        } else {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.range, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}
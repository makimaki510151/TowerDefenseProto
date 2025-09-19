// skill.js
import FieldEffect from './fieldEffect.js';

export default class Skill {
    constructor(name, power, game, cooldown, range, type, targetType, targetCount, condition) {
        this.name = name;
        this.power = power;
        this.game = game;
        this.cooldown = cooldown;
        this.range = range;
        this.type = type;
        this.targetType = targetType || 'closest';
        this.targetCount = targetCount || 1;
        this.condition = condition || 'default';
        this.shieldDuration = 180;
    }

    canUse(caster, enemies) {
        if (caster.currentSkillCooldown > 0) {
            return false;
        }

        // 範囲内に敵がいるかどうかの判定
        const enemiesInRange = enemies.filter(target => {
            const distance = Math.hypot(caster.position.x - target.position.x, caster.position.y - target.position.y);
            return distance <= this.range;
        });

        if (this.condition === 'group') {
            return enemiesInRange.length >= 3;
        } else if (this.condition === 'line') {
            // ★ここから修正
            const rectWidth = this.range; // スキル範囲を長方形の幅として使用
            const rectHeight = 100; // 長方形の高さを任意に設定

            const rectEnemies = enemies.filter(enemy => {
                const enemyCenterX = enemy.position.x + 20;
                const enemyCenterY = enemy.position.y + 20;

                // 長方形の境界を定義（左方向へ伸びる）
                const left = caster.position.x - rectWidth;
                const right = caster.position.x;
                const top = caster.position.y - rectHeight / 2;
                const bottom = caster.position.y + rectHeight / 2;

                // 敵の中心点が長方形の範囲内にあるか判定
                return enemyCenterX >= left && enemyCenterX <= right &&
                    enemyCenterY >= top && enemyCenterY <= bottom;
            });
            // 範囲内に1体でも敵がいればスキル発動
            return rectEnemies.length >= 1;
        }
        return enemiesInRange.length > 0;
    }

    use(caster, enemies, stackCount = 1) {
        // スキル「苦しいでしょう？」の個別処理
        if (this.name === '苦しいでしょう？') {
            const slowFactor = 0.5;
            const duration = 5;

            const rectWidth = this.range;
            const rectHeight = 100;
            const left = caster.position.x - rectWidth;
            const right = caster.position.x;
            const top = caster.position.y - rectHeight / 2;
            const bottom = caster.position.y + rectHeight / 2;

            const targets = enemies.filter(enemy => {
                const enemyCenterX = enemy.position.x;
                const enemyCenterY = enemy.position.y;
                return enemyCenterX >= left && enemyCenterX <= right &&
                    enemyCenterY >= top && enemyCenterY <= bottom;
            });

            // ここを修正：長方形の中心座標ではなく、スキル発動者の位置を渡すように変更
            // そして、rectWidthとrectHeightをFieldEffectのコンストラクタに正しく渡す
            this.game.fieldEffects.push(new FieldEffect(this.game, caster, caster.position, this.range, duration, this.power, slowFactor, 'rectangle', rectWidth, rectHeight));

            this.game.addMessage(`${caster.name} が ${this.name} を発動し、範囲内にダメージと速度低下のフィールドを展開した！`);
            return; // 処理を終了
        }
        else {
            const enemiesInRange = enemies.filter(target => {
                const distance = Math.hypot(caster.position.x - target.position.x, caster.position.y - target.position.y);
                return distance <= this.range;
            });

            if (enemiesInRange.length === 0) {
                return;
            }

            let targets = [];
            if (this.targetType === 'closest') {
                enemiesInRange.sort((a, b) => Math.hypot(caster.position.x - a.position.x, caster.position.y - a.position.y) - Math.hypot(caster.position.x - b.position.x, caster.position.y - b.position.y));
                targets = enemiesInRange.slice(0, this.targetCount);
            } else if (this.targetType === 'multiple') {
                targets = enemiesInRange;
            } else if (this.targetType === 'highestHP') {
                enemiesInRange.sort((a, b) => b.hp - a.hp);
                targets = enemiesInRange.slice(0, this.targetCount);
            }

            let hasHit = false;
            targets.forEach(target => {
                // スキル名で個別処理を分岐
                if (this.name === '魔法弾') {
                    const damage = Math.max(1, (caster.magicAttack * this.power * stackCount) - target.magicDefense);
                    this.game.addMessage(`${caster.name} が ${this.name} で ${target.name} に ${damage.toFixed(1)} ダメージを与えた！ (${stackCount}スタック消費)`);
                    target.takeDamage(damage);
                }
                // 他のスキルも個別に分岐
                else if (this.name === 'Fireball') {
                    const damage = Math.max(1, (caster.magicAttack * this.power) - target.magicDefense);
                    this.game.addMessage(`${caster.name} が ${this.name} で ${target.name} に ${damage.toFixed(1)} ダメージを与えた！`);
                    target.takeDamage(damage);
                }
                else if (this.name === '触れられるとでも？') {
                    const damage = Math.max(1, (caster.magicAttack * this.power) - target.magicDefense);
                    this.game.addMessage(`${caster.name} が ${this.name} で ${target.name} に ${damage.toFixed(1)} ダメージを与えた！`);
                    target.takeDamage(damage);
                    const knockbackDistance = 50;
                    const angle = Math.atan2(target.position.y - caster.position.y, target.position.x - caster.position.x);
                    target.position.x += Math.cos(angle) * knockbackDistance;
                    target.position.y += Math.sin(angle) * knockbackDistance;
                }
                else if (this.name === 'もう大丈夫') {
                    target.shieldHp = this.power;
                    target.shieldDuration = this.shieldDuration;
                    this.game.addMessage(`${caster.name} が ${target.name} にシールドを付与した！`);
                }
                else {
                    // デフォルトの物理・魔法ダメージ計算
                    const damage = Math.max(1, (caster.attack * this.power) - target.physicalDefense);
                    this.game.addMessage(`${caster.name} が ${this.name} で ${target.name} に ${damage.toFixed(1)} ダメージを与えた！`);
                    target.takeDamage(damage);
                }
                hasHit = true;
            });
        }
    }
}
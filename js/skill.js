// skill.js
import FieldEffect from './fieldEffect.js'; // ★追加

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
            const rectEnemies = enemies.filter(enemy => {
                const enemyCenterX = enemy.position.x + 20;
                const enemyCenterY = enemy.position.y + 20;
                const relX = enemyCenterX - caster.position.x;
                const relY = enemyCenterY - caster.position.y;
                const rotationAngle = Math.atan2(relY, relX);
                const rectWidth = 100;
                const rectHeight = 50;
                const rotatedX = relX * Math.cos(-rotationAngle) - relY * Math.sin(-rotationAngle);
                const rotatedY = relX * Math.sin(-rotationAngle) + relY * Math.cos(-rotationAngle);
                return rotatedX >= 0 && rotatedX <= rectWidth && rotatedY >= -rectHeight / 2 && rotatedY <= rectHeight / 2;
            });
            return rectEnemies.length >= 1;
        }
        return enemiesInRange.length > 0;
    }

    use(caster, enemies, stackCount = 1) {
        // ... (targetsの選定ロジックは変更なし)

        // ★スキル名で個別処理を分岐
        if (this.name === '苦しいでしょう？') {
            const slowFactor = 0.5; // 50%減速
            const duration = 5; // 5秒間
            const damagePerTick = caster.magicAttack * this.power / duration;
            this.game.fieldEffects.push(new FieldEffect(this.game, caster, caster.position, this.range, duration, damagePerTick, slowFactor));
            this.game.addMessage(`${caster.name} が ${this.name} を発動し、範囲内にダメージと速度低下のフィールドを展開した！`);
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
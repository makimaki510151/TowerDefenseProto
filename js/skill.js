// skill.js
export default class Skill {
    constructor(name, power, game, cooldown, range, type, targetType, targetCount) {
        this.name = name;
        this.power = power;
        this.game = game;
        this.cooldown = cooldown; // クールタイムの秒数
        this.currentCooldown = 0; // 現在のクールタイム
        this.range = range;
        this.type = type; // 'physical' or 'magic'
        this.targetType = targetType || 'closest'; // デフォルトは一番近い敵
        this.targetCount = targetCount || 1; // デフォルトは1体
    }

    // スキルを発動できるかチェックするメソッド
    canUse() {
        return this.currentCooldown <= 0;
    }

    use(caster, enemies) {
        if (!this.canUse()) {
            return;
        }

        // 範囲内の敵をフィルタリング
        const enemiesInRange = enemies.filter(target => {
            const distance = Math.sqrt(Math.pow(caster.position.x - target.position.x, 2) + Math.pow(caster.position.y - target.position.y, 2));
            return distance < this.range;
        });

        if (enemiesInRange.length === 0) {
            return; // 範囲内に敵がいない場合は何もしない
        }

        // ターゲットタイプに基づいてソート
        if (this.targetType === 'closest') {
            enemiesInRange.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(caster.position.x - a.position.x, 2) + Math.pow(caster.position.y - a.position.y, 2));
                const distB = Math.sqrt(Math.pow(caster.position.x - b.position.x, 2) + Math.pow(caster.position.y - b.position.y, 2));
                return distA - distB;
            });
        } else if (this.targetType === 'furthest') {
            enemiesInRange.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(caster.position.x - a.position.x, 2) + Math.pow(caster.position.y - a.position.y, 2));
                const distB = Math.sqrt(Math.pow(caster.position.x - b.position.x, 2) + Math.pow(caster.position.y - b.position.y, 2));
                return distB - distA;
            });
        }

        // ターゲット数に基づいて攻撃対象を決定
        const targetsToAttack = enemiesInRange.slice(0, this.targetCount);

        let hasHit = false;
        targetsToAttack.forEach(target => {
            let damage = 0;
            if (this.type === 'physical') {
                damage = Math.max(1, (caster.attack * this.power) - target.physicalDefense);
            } else if (this.type === 'magic') {
                damage = Math.max(1, (caster.magicAttack * this.power) - target.magicDefense);
            }
            
            this.game.addMessage(`${caster.name} が ${this.type === 'physical' ? '物理' : '魔法'}スキルで ${target.name} に ${damage.toFixed(1)} ダメージを与えた！`);
            target.takeDamage(damage);
            hasHit = true;
        });

        if (hasHit) {
            this.currentCooldown = this.cooldown * 60;
        }
    }

    // クールタイムを更新するメソッド
    update() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
}
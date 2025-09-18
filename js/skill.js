// skill.js

export default class Skill {
    constructor(name, power, game, cooldown, range, type, targetType, targetCount, condition) {
        this.name = name;
        this.power = power;
        this.game = game;
        this.cooldown = cooldown;
        this.currentCooldown = 0;
        this.range = range;
        this.type = type;
        this.targetType = targetType || 'closest';
        this.targetCount = targetCount || 1;
        this.condition = condition || 'default';
        this.shieldDuration = 180;
    }

    canUse(caster, enemies) {
        if (this.currentCooldown > 0) {
            return false;
        }

        const enemiesInRange = enemies.filter(target => {
            const distance = Math.sqrt(Math.pow(caster.position.x - target.position.x, 2) + Math.pow(caster.position.y - target.position.y, 2));
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
                return relX < 0 && relX > -this.range && Math.abs(relY) < 40;
            });
            return rectEnemies.length > 0;
        } else if (this.condition === 'default') {
            return true;
        }
        return false;
    }

    use(caster, enemies, characters) {
        if (!this.canUse(caster, enemies)) {
            return;
        }

        let targetsToAttack = [];

        if (this.targetType === 'multiple') {
            targetsToAttack = enemies.filter(target => {
                const distance = Math.sqrt(Math.pow(caster.position.x - target.position.x, 2) + Math.pow(caster.position.y - target.position.y, 2));
                return distance < this.range;
            });
        } else if (this.targetType === 'rectangle') {
            targetsToAttack = enemies.filter(enemy => {
                const enemyCenterX = enemy.position.x + 20;
                const enemyCenterY = enemy.position.y + 20;

                const relX = enemyCenterX - caster.position.x;
                const relY = enemyCenterY - caster.position.y;
                return relX < 0 && relX > -this.range && Math.abs(relY) < 40;
            });
        } else if (this.targetType === 'ally') {
            targetsToAttack = characters;
        } else {
            const enemiesInRange = enemies.filter(target => {
                const distance = Math.sqrt(Math.pow(caster.position.x - target.position.x, 2) + Math.pow(caster.position.y - target.position.y, 2));
                return distance < this.range;
            });

            if (enemiesInRange.length === 0) {
                return;
            }

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
            targetsToAttack = enemiesInRange.slice(0, this.targetCount);
        }

        if (targetsToAttack.length === 0) {
            return;
        }

        let hasHit = false;
        targetsToAttack.forEach(target => {
            if (this.type === 'physical') {
                let damage = Math.max(1, (caster.attack * this.power) - target.physicalDefense);
                this.game.addMessage(`${caster.name} が ${this.name} で ${target.name} に ${damage.toFixed(1)} ダメージを与えた！`);
                target.takeDamage(damage);
            } else if (this.type === 'magic') {
                let damage = Math.max(1, (caster.magicAttack * this.power) - target.magicDefense);
                this.game.addMessage(`${caster.name} が ${this.name} で ${target.name} に ${damage.toFixed(1)} ダメージを与えた！`);
                target.takeDamage(damage);

                if (this.name === 'Magic Shockwave') {
                    const knockbackDistance = 50;
                    const angle = Math.atan2(target.position.y - caster.position.y, target.position.x - caster.position.x);
                    target.position.x += Math.cos(angle) * knockbackDistance;
                    target.position.y += Math.sin(angle) * knockbackDistance;
                }
            } else if (this.type === 'support') {
                target.shieldHp = this.power;
                target.shieldDuration = this.shieldDuration;
                this.game.addMessage(`${caster.name} が ${target.name} にシールドを付与した！`);
            }
            hasHit = true;
        });

        if (hasHit) {
            this.currentCooldown = this.cooldown * 60;
        }
    }

    update() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
}
// enemy.js
import DamageText from './damageText.js';

export default class Enemy {
    constructor(name, hp, attack, speed, position, pointValue, image, game, physicalDefense, magicDefense, attackType) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.speed = speed;
        this.position = position;
        this.isAlive = true;
        this.pointValue = pointValue;
        this.image = image;
        this.game = game;
        this.attackCooldown = 0;
        this.attackInterval = 60;
        this.physicalDefense = physicalDefense; // 物理防御力
        this.magicDefense = magicDefense; // 魔法防御力
        this.attackType = attackType; // 'physical' or 'magic'

        this.originalSpeed = speed; // 元の速度を保存
    }
    
    // ★slowメソッドは不要になったため削除

    update(characters, wall, game) {
        if (!this.isAlive) {
            return;
        }

        this.attackCooldown = Math.max(0, this.attackCooldown - 1);

        let target = null;
        let closestDistance = Infinity;

        characters.forEach(char => {
            const distance = Math.sqrt(Math.pow(this.position.x - char.position.x, 2) + Math.pow(this.position.y - char.position.y, 2));
            if (distance < closestDistance) {
                closestDistance = distance;
                target = char;
            }
        });

        if (target) {
            const distanceToTarget = Math.sqrt(Math.pow(target.position.x - this.position.x, 2) + Math.pow(target.position.y - this.position.y, 2));
            const attackRange = 25;

            if (distanceToTarget > attackRange) {
                const angle = Math.atan2(target.position.y - this.position.y, target.position.x - this.position.x);
                this.position.x += Math.cos(angle) * this.speed;
                this.position.y += Math.sin(angle) * this.speed;
            }

            if (distanceToTarget <= attackRange && this.attackCooldown === 0) {
                // 攻撃タイプに応じてダメージ計算
                let damage = 0;
                if (this.attackType === 'physical') {
                    damage = Math.max(1, this.attack - target.physicalDefense);
                } else if (this.attackType === 'magic') {
                    damage = Math.max(1, this.attack - target.magicDefense);
                }
                
                this.game.addMessage(`${this.name} が ${this.attackType === 'physical' ? '物理' : '魔法'}攻撃で ${target.name} に ${damage.toFixed(1)} ダメージを与えた！`);
                target.takeDamage(damage);
                this.attackCooldown = this.attackInterval;
            }

        } else {
            const distanceToWall = Math.sqrt(Math.pow(wall.position.x - this.position.x, 2));
            const wallAttackRange = 30;

            if (distanceToWall > wallAttackRange) {
                this.position.x += this.speed;
            }

            else if (this.attackCooldown === 0) {
                wall.hp -= this.attack;
                this.game.addMessage(`${this.name} が壁に ${this.attack} ダメージを与えた！`);
                this.game.damageTexts.push(new DamageText(
                    this.attack,
                    wall.position.x,
                    this.game.canvas.height / 2 + (Math.random() - 0.5) * this.game.canvas.height
                ));
                this.attackCooldown = this.attackInterval;
            }
        }

        if (this.hp <= 0) {
            this.isAlive = false;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.game.damageTexts.push(new DamageText(
            damage,
            this.position.x,
            this.position.y - 20
        ));
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} (${this.hp})`, this.position.x, this.position.y - 30);
    }
}
// enemy.js
import DamageText from './damageText.js';

export default class Enemy {
    constructor(name, hp, attack, speed, position, pointValue, image, game) {
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
    }

    // `wall` パラメータを追加
    update(characters, wall) {
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

        // 移動ロジック
        if (target) {
            // キャラクターがターゲットの場合の移動と攻撃ロジックは変更なし
            const distanceToTarget = Math.sqrt(Math.pow(target.position.x - this.position.x, 2) + Math.pow(target.position.y - this.position.y, 2));
            const attackRange = 25;

            if (distanceToTarget > attackRange) {
                const angle = Math.atan2(target.position.y - this.position.y, target.position.x - this.position.x);
                this.position.x += Math.cos(angle) * this.speed;
                this.position.y += Math.sin(angle) * this.speed;
            }

            if (distanceToTarget <= attackRange && this.attackCooldown === 0) {
                this.game.addMessage(`${this.name} が ${target.name} に ${this.attack} ダメージを与えた！`);
                target.takeDamage(this.attack);
                this.attackCooldown = this.attackInterval;
            }

        } else {
            // キャラクターがいない場合は壁をターゲットにする
            const distanceToWall = Math.sqrt(Math.pow(wall.position.x - this.position.x, 2)); // 壁はX座標のみ
            const wallAttackRange = 30; // 壁への攻撃範囲

            if (distanceToWall > wallAttackRange) {
                this.position.x += this.speed;
            }

            // 壁に到達したら攻撃
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
        // 敵が倒されたときにポイントを加算
        if (this.hp <= 0) {
            this.game.addPoints(this.pointValue);
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} (${this.hp})`, this.position.x, this.position.y - 30);
    }
}
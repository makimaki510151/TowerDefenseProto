export default class Enemy {
    constructor(hp, attack, speed, position, pointValue) {
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.speed = speed;
        this.position = position;
        this.isAlive = true;
        this.pointValue = pointValue; // 撃破時のポイントを追加
    }

    update() {
        this.position.x += this.speed / 60;
        if (this.hp <= 0) {
            this.isAlive = false;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
    }
}
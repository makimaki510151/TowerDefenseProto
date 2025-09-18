export default class Enemy {
    constructor(hp, attack, speed, position) {
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.speed = speed;
        this.position = position;
        this.isAlive = true;
    }

    update() {
        // シンプルに右方向へ移動
        this.position.x += this.speed / 60; // 60FPSを想定
        if (this.hp <= 0) {
            this.isAlive = false;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
    }
}
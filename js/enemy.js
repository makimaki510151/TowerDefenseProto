export default class Enemy {
    constructor(hp, attack, speed, position, pointValue, image) {
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.speed = speed;
        this.position = position;
        this.isAlive = true;
        this.pointValue = pointValue;
        this.image = image; // 画像プロパティを追加
    }

    update() {
        this.position.x += this.speed;
        if (this.hp <= 0) {
            this.isAlive = false;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
    }
}
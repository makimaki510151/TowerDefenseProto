export default class Enemy {
    constructor(name, hp, attack, speed, position, pointValue, image) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.speed = speed;
        this.position = position;
        this.isAlive = true;
        this.pointValue = pointValue;
        this.image = image;
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

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} (${this.hp})`, this.position.x, this.position.y - 30);
    }
}
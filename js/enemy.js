import DamageText from './damageText.js'; // 💡 追加

export default class Enemy {
    constructor(name, hp, attack, speed, position, pointValue, image, game) { // 💡 gameインスタンスを受け取る
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.speed = speed;
        this.position = position;
        this.isAlive = true;
        this.pointValue = pointValue;
        this.image = image;
        this.game = game; // 💡 gameインスタンスをプロパティとして保持
    }

    update() {
        this.position.x += this.speed;
        if (this.hp <= 0) {
            this.isAlive = false;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        // 💡 ダメージを受けたときにDamageTextを生成してGameに渡す
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
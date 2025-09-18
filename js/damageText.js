export default class DamageText {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.life = 60; // 表示されるフレーム数（60フレームで約1秒）
        this.yVelocity = -0.5; // 上に移動する速度
    }

    update() {
        this.y += this.yVelocity;
        this.life--;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
    }
}
export default class Skill {
    constructor(name, power, game, cooldown, range) {
        this.name = name;
        this.power = power;
        this.game = game;
        this.cooldown = cooldown; // クールタイムの秒数
        this.currentCooldown = 0; // 現在のクールタイム
        this.range = range
    }

    // スキルを発動できるかチェックするメソッド
    canUse() {
        return this.currentCooldown <= 0;
    }

    use(caster, targets) {
        if (!this.canUse()) {
            // クールタイム中の場合は何もしない
            return;
        }

        let hasHit = false;
        targets.forEach(target => {
            const distance = Math.sqrt(Math.pow(caster.position.x - target.position.x, 2) + Math.pow(caster.position.y - target.position.y, 2));
            console.log(distance)
            if (distance < this.range) {
                this.game.addMessage(`${caster.name} が ${target.name} に ${this.power} ダメージを与えた！`);
                target.takeDamage(this.power);
                hasHit = true;
            }
        });

        // 誰かにヒットしたらクールタイムを開始
        if (hasHit) {
            this.currentCooldown = this.cooldown * 60; // 秒数をフレーム数に変換
        }
    }

    // クールタイムを更新するメソッド
    update() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
}
export default class Skill {
    constructor(name, power, game) {
        this.name = name;
        this.power = power;
        this.game = game;
    }

    use(caster, targets) {
        targets.forEach(target => {
            const distance = Math.sqrt(Math.pow(caster.position.x - target.position.x, 2) + Math.pow(caster.position.y - target.position.y, 2));
            if (distance < 200) {
                this.game.addMessage(`${caster.name} が ${target.name} に ${this.power} ダメージを与えた！`);
                target.takeDamage(this.power);
            }
        });
    }
}
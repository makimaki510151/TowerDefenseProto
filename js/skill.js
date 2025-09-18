export default class Skill {
    constructor(name, power) {
        this.name = name;
        this.power = power;
    }

    use(casterPosition, targets) {
        // スキルの発動ロジック
        // 例: 射程内の敵にダメージを与える
        targets.forEach(target => {
            const distance = Math.sqrt(Math.pow(casterPosition.x - target.position.x, 2) + Math.pow(casterPosition.y - target.position.y, 2));
            if (distance < 200) { // 射程が5マス以内
                console.log(`${this.name}が${target.name}に${this.power}ダメージを与えた！`);
                target.takeDamage(this.power);
            }
        });
    }
}
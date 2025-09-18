import Skill from './skill.js';

export default class Character {
    constructor(name, hp, attack, position) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.position = position;
        this.skills = [new Skill('Fireball', 5)]; // スキルの例
    }

    update(enemies) {
        // スキルを自動で使う
        this.skills.forEach(skill => {
            skill.use(this.position, enemies);
        });
    }
}
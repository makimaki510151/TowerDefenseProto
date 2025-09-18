import Skill from './skill.js';

export default class Character {
    constructor(name, hp, attack, position, cost) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.position = position;
        this.cost = cost; // コストを追加
        this.skills = [new Skill('Fireball', 5)];
    }

    update(enemies) {
        this.skills.forEach(skill => {
            skill.use(this.position, enemies);
        });
    }
}

// キャラクターの種類をエクスポート
export const CharacterTypes = {
    MAGE: { name: 'Mage', hp: 80, attack: 10, cost: 50 },
    ARCHER: { name: 'Archer', hp: 100, attack: 15, cost: 75 }
};
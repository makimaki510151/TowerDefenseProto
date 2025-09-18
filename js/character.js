import Skill from './skill.js';

export default class Character {
    constructor(name, hp, attack, position, cost, image) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.position = position;
        this.cost = cost;
        this.skills = [new Skill('Fireball', 5)];
        this.image = image; // 画像プロパティを追加
    }

    update(enemies) {
        this.skills.forEach(skill => {
            skill.use(this.position, enemies);
        });
    }
}

// キャラクターの種類に画像パスを追加
export const CharacterTypes = {
    MAGE: { name: 'Mage', hp: 80, attack: 10, cost: 50, imagePath: 'assets/mage.png' },
    ARCHER: { name: 'Archer', hp: 100, attack: 15, cost: 75, imagePath: 'assets/archer.png' }
};
import Skill from './skill.js';

export default class Character {
    constructor(name, hp, attack, position, cost, image, skills) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.position = position;
        this.cost = cost;
        this.skills = skills;
        this.image = image;
    }

    update(enemies, game) {
        this.skills.forEach(skill => {
            skill.update(); // クールタイムを更新
            skill.use(this, enemies);
        });
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} (${this.hp})`, this.position.x, this.position.y - 30);
    }
}

// キャラクターの種類にスキル情報を追加
export const CharacterTypes = {
    MAGE: {
        name: 'キャラ1', hp: 80, attack: 10, cost: 50, imagePath: 'assets/mage.png',
        skills: [
            { name: 'Fireball', power: 30, cooldown: 2, range: 200 } // 威力30、クールタイム2秒
        ]
    },
    ARCHER: {
        name: 'キャラ2', hp: 100, attack: 15, cost: 75, imagePath: 'assets/archer.png',
        skills: [
            { name: 'Arrow Shot', power: 15, cooldown: 1, range: 200 } // 威力15、クールタイム1秒
        ]
    }
};
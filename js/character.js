import Skill from './skill.js';

export default class Character {
    constructor(name, hp, attack, position, cost, image) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.position = position;
        this.cost = cost;
        this.skills = []; // ここで初期化
        this.image = image;
    }

    update(enemies, game) {
        // gameインスタンスを受け取ってからSkillを生成
        if (this.skills.length === 0) {
            this.skills.push(new Skill('Fireball', this.attack, game));
        }
        
        this.skills.forEach(skill => {
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

export const CharacterTypes = {
    MAGE: { name: 'Mage', hp: 80, attack: 10, cost: 50, imagePath: 'assets/mage.png' },
    ARCHER: { name: 'Archer', hp: 100, attack: 15, cost: 75, imagePath: 'assets/archer.png' }
};
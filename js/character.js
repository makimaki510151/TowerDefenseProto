import Skill from './skill.js';

export default class Character {
    // コンストラクタに game インスタンスを受け取るように変更
    constructor(name, hp, attack, position, image, skillsData, game) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.position = position;
        this.image = image;
        this.isAlive = true;

        // スキルデータを Skill クラスのインスタンスに変換
        this.skills = skillsData.map(skillInfo => new Skill(skillInfo.name, skillInfo.power, game, skillInfo.cooldown, skillInfo.range));
    }

    update(enemies) {
        if (!this.isAlive) {
            return;
        }
        this.skills.forEach(skill => {
            skill.update();
            skill.use(this, enemies);
        });
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.isAlive = false;
            console.log(`${this.name} は倒されました。`);
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} (${this.hp})`, this.position.x, this.position.y - 30);
    }
}

export const CharacterTypes = {
    MAGE: {
        name: 'キャラ1', hp: 80, attack: 10, imagePath: 'assets/mage.png',
        skills: [
            { name: 'Fireball', power: 30, cooldown: 2, range: 200 }
        ]
    },
    ARCHER: {
        name: 'キャラ2', hp: 60, attack: 15, imagePath: 'assets/archer.png',
        skills: [
            { name: 'Arrow Shot', power: 20, cooldown: 1, range: 300 }
        ]
    }
};

export const PassiveTypes = {
    HP_BOOST: {
        name: 'HPブースト',
        description: '全キャラクターの最大HPを20%増加させる。',
        apply: (characters) => {
            characters.forEach(char => {
                char.maxHp *= 1.2;
                char.hp = char.maxHp;
            });
        }
    },
    ATTACK_BOOST: {
        name: '攻撃力ブースト',
        description: '全キャラクターの攻撃力を15%増加させる。',
        apply: (characters) => {
            characters.forEach(char => {
                char.attack *= 1.15;
                char.skills.forEach(skill => {
                    skill.power *= 1.15;
                });
            });
        }
    },
    COOLDOWN_REDUCTION: {
        name: 'クールタイム短縮',
        description: '全キャラクターのスキルのクールタイムを20%短縮させる。',
        apply: (characters) => {
            characters.forEach(char => {
                char.skills.forEach(skill => {
                    skill.cooldown *= 0.8;
                    // すでにクールタイム中の場合は再計算
                    if (skill.currentCooldown > 0) {
                        skill.currentCooldown = skill.cooldown * 60;
                    }
                });
            });
        }
    }
};
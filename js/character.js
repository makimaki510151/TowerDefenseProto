// character.js
import Skill from './skill.js';

export default class Character {
    // コンストラクタに game インスタンスを受け取るように変更
    constructor(name, hp, attack, magicAttack, physicalDefense, magicDefense, position, image, skillsData, game) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack; // 物理攻撃力
        this.magicAttack = magicAttack; // 魔法攻撃力
        this.physicalDefense = physicalDefense; // 物理防御力
        this.magicDefense = magicDefense; // 魔法防御力
        this.position = position;
        this.image = image;
        this.isAlive = true;

        // スキルデータを Skill クラスのインスタンスに変換
        this.skills = skillsData.map(skillInfo => new Skill(skillInfo.name, skillInfo.power, game, skillInfo.cooldown, skillInfo.range, skillInfo.type, skillInfo.targetType, skillInfo.targetCount));
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
        name: 'キャラ1 (魔法使い)', hp: 80, attack: 5, magicAttack: 25, physicalDefense: 5, magicDefense: 20, imagePath: 'assets/mage.png',
        skills: [
            // ターゲットタイプとターゲット数を追加
            { name: 'Fireball', power: 1.5, cooldown: 2, range: 200, type: 'magic', targetType: 'closest', targetCount: 1 }
        ]
    },
    ARCHER: {
        name: 'キャラ2 (弓使い)', hp: 60, attack: 15, magicAttack: 0, physicalDefense: 15, magicDefense: 5, imagePath: 'assets/archer.png',
        skills: [
            // ターゲットタイプとターゲット数を追加
            { name: 'Arrow Shot', power: 1.2, cooldown: 1, range: 300, type: 'physical', targetType: 'closest', targetCount: 1 }
        ]
    },
    SNIPER: {
        name: 'キャラ3 (スナイパー)', hp: 50, attack: 20, magicAttack: 0, physicalDefense: 10, magicDefense: 5, imagePath: 'assets/sniper.png',
        skills: [
            // 遠い敵を狙うスキル
            { name: 'Long Shot', power: 2.0, cooldown: 3, range: 400, type: 'physical', targetType: 'furthest', targetCount: 1 }
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
        description: '全キャラクターの物理攻撃力と魔法攻撃力を15%増加させる。',
        apply: (characters) => {
            characters.forEach(char => {
                char.attack *= 1.15;
                char.magicAttack *= 1.15;
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
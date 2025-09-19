import Skill from './skill.js';
import DamageText from './damageText.js';

export default class Character {
    constructor(name, hp, attack, magicAttack, physicalDefense, magicDefense, attackRange, attackSpeed, position, image, skillsData, game) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.magicAttack = magicAttack;
        this.physicalDefense = physicalDefense;
        this.magicDefense = magicDefense;
        this.attackRange = attackRange;
        this.attackSpeed = attackSpeed;
        this.currentAttackCooldown = 0;
        this.position = position;
        this.image = image;
        this.isAlive = true;
        this.game = game;

        this.shieldHp = 0;
        this.shieldDuration = 0;
        this.currentSkillCooldown = 0;

        // ★個別処理用のプロパティを初期化
        if (this.name === 'まふぃ') {
            this.specialStack = 0;
        }

        this.skills = skillsData.map(skillInfo => new Skill(skillInfo.name, skillInfo.power, this.game, skillInfo.cooldown, skillInfo.range, skillInfo.type, skillInfo.targetType, skillInfo.targetCount, skillInfo.condition));
    }

    update(enemies) {
        if (!this.isAlive) {
            return;
        }

        this.currentAttackCooldown -= 1;
        this.currentSkillCooldown -= 1;

        if (this.shieldDuration > 0) {
            this.shieldDuration--;
            if (this.shieldDuration === 0) {
                this.shieldHp = 0;
                this.game.addMessage(`${this.name} のシールドが切れました。`);
            }
        }

        // 共通の通常攻撃処理
        if (this.currentAttackCooldown <= 0) {
            const isPhysicalAttack = this.attack > this.magicAttack;
            const baseDamage = isPhysicalAttack ? this.attack : this.magicAttack;
            let target = null;
            let closestDistance = Infinity;

            enemies.forEach(enemy => {
                const distance = Math.hypot(this.position.x - enemy.position.x, this.position.y - enemy.position.y);
                if (distance <= this.attackRange && distance < closestDistance) {
                    closestDistance = distance;
                    target = enemy;
                }
            });

            if (target) {
                const targetDefense = isPhysicalAttack ? target.physicalDefense : target.magicDefense;
                const damage = Math.max(0, baseDamage - targetDefense);
                target.takeDamage(damage);
                this.game.addMessage(`${this.name} は ${target.name} に ${damage.toFixed(1)} の通常攻撃ダメージを与えました。`);
                const baseCooldownValue = 120;
                this.currentAttackCooldown = baseCooldownValue / this.attackSpeed * 60; //フレームを秒に直す

                // ★キャラクターごとの個別処理（通常攻撃後）
                if (this.name === 'まふぃ') {
                    this.specialStack++;
                    this.game.addMessage(`まふぃのスタックが ${this.specialStack} になりました。`);
                }
            }
        }

        // ★キャラクターごとの個別スキル発動処理
        if (this.name === 'まふぃ' && this.specialStack > 0 && this.currentSkillCooldown <= 0) {
            const magicBulletSkill = this.skills.find(s => s.name === '魔法弾');
            if (magicBulletSkill) {
                magicBulletSkill.use(this, enemies, this.specialStack);
                this.specialStack = 0;
                this.currentSkillCooldown = magicBulletSkill.cooldown * 60;
            }
        }
        
        else if (this.currentSkillCooldown <= 0) {
            let skillUsed = false;
            
            for (const skill of this.skills) {
                if (this.name === 'まふぃ' && skill.name === '魔法弾') {
                    continue;
                }
                
                // 零唯のスキル発動ロジック
                if (this.name === '零唯') {
                    if (skill.name === 'もう大丈夫') {
                        // '触れられるとでも？'と'苦しいでしょう？'の条件を満たさない場合のみ発動
                        const isGroupSkillUsable = this.skills.find(s => s.name === '触れられるとでも？').canUse(this, enemies);
                        const isLineSkillUsable = this.skills.find(s => s.name === '苦しいでしょう？').canUse(this, enemies);
                        if (!isGroupSkillUsable && !isLineSkillUsable) {
                            skill.use(this, enemies);
                            this.currentSkillCooldown = skill.cooldown * 60;
                            skillUsed = true;
                            break;
                        }
                    } else if (skill.canUse(this, enemies)) {
                        skill.use(this, enemies);
                        this.currentSkillCooldown = skill.cooldown * 60;
                        skillUsed = true;
                        break;
                    }
                } else {
                    // 他のキャラクターの通常スキル発動ロジック
                    if (skill.canUse(this, enemies)) {
                        skill.use(this, enemies);
                        this.currentSkillCooldown = skill.cooldown * 60;
                        skillUsed = true;
                        break;
                    }
                }
            }
        }
    }

    takeDamage(damage) {
        if (this.shieldHp > 0) {
            const damageToShield = Math.min(damage, this.shieldHp);
            this.shieldHp -= damageToShield;
            const remainingDamage = damage - damageToShield;
            this.game.damageTexts.push(new DamageText(damageToShield, this.position.x, this.position.y - 20, 'shield'));
            if (remainingDamage > 0) {
                this.hp -= remainingDamage;
                this.game.damageTexts.push(new DamageText(remainingDamage, this.position.x, this.position.y - 20));
            }
        } else {
            this.hp -= damage;
            this.game.damageTexts.push(new DamageText(damage, this.position.x, this.position.y - 20));
        }

        if (this.hp <= 0) {
            this.isAlive = false;
            console.log(`${this.name} は倒されました。`);
        }
    }

    draw(ctx) {
        // キャラクター画像を描画
        // 画像が読み込まれていれば描画、そうでなければ描画しない
        if (this.image) {
            ctx.drawImage(this.image, this.position.x - 25, this.position.y - 25, 50, 50);
        }

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.name} (${this.hp})`, this.position.x, this.position.y - 30);
        if (this.shieldHp > 0) {
            const shieldBarWidth = 30;
            const shieldBarHeight = 5;
            const shieldBarX = this.position.x - shieldBarWidth / 2;
            const shieldBarY = this.position.y - 40;
            ctx.fillStyle = 'cyan';
            ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth * (this.shieldHp / 100), shieldBarHeight);
            ctx.strokeStyle = 'blue';
            ctx.strokeRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);
        }
    }
}

export const CharacterTypes = {
    MAGE: {
        name: 'キャラ1 (魔法使い)', hp: 80, attack: 5, magicAttack: 25, physicalDefense: 5, magicDefense: 20, attackRange: 150, attackSpeed: 60, imagePath: 'assets/mage.png',
        skillsData: [
            { name: 'Fireball', power: 1.5, cooldown: 2, range: 200, type: 'magic', targetType: 'closest', targetCount: 1 }
        ]
    },
    ARCHER: {
        name: 'キャラ2 (弓使い)', hp: 60, attack: 15, magicAttack: 0, physicalDefense: 15, magicDefense: 5, attackRange: 250, attackSpeed: 45, imagePath: 'assets/archer.png',
        skillsData: [
            { name: 'Arrow Shot', power: 1.2, cooldown: 1, range: 300, type: 'physical', targetType: 'closest', targetCount: 1 }
        ]
    },
    SNIPER: {
        name: 'キャラ3 (スナイパー)', hp: 50, attack: 20, magicAttack: 0, physicalDefense: 10, magicDefense: 5, attackRange: 350, attackSpeed: 90, imagePath: 'assets/sniper.png',
        skillsData: [
            { name: 'Long Shot', power: 2.0, cooldown: 3, range: 400, type: 'physical', targetType: 'furthest', targetCount: 1 }
        ]
    },
    REI: {
        name: '零唯', hp: 80, attack: 0, magicAttack: 25, physicalDefense: 5, magicDefense: 20, attackRange: 120, attackSpeed: 60, imagePath: 'assets/rei.png',
        skillsData: [
            { name: '触れられるとでも？', power: 1.5, cooldown: 10, range: 150, type: 'magic', targetType: 'multiple', targetCount: 99, condition: 'group' },
            { name: '苦しいでしょう？', power: 0.2, cooldown: 10, range: 250, type: 'magic', targetType: 'rectangle', targetCount: 99, condition: 'line' },
            { name: 'もう大丈夫', power: 100, cooldown: 10, range: 0, type: 'support', targetType: 'ally', targetCount: 99, condition: 'default' }
        ]
    },
    MAFI: {
        name: 'まふぃ',
        hp: 120,
        attack: 10,
        magicAttack: 40,
        physicalDefense: 5,
        magicDefense: 10,
        attackRange: 200,
        attackSpeed: 60,
        imagePath: 'assets/mafi.png',
        attackType: 'magic',
        skillsData: [
            { name: '魔法弾', power: 0.5, cooldown: 13, range: 300, type: 'magic', targetType: 'highestHP', targetCount: 1, condition: 'manual' }
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
                    if (skill.currentCooldown > 0) {
                        skill.currentCooldown = skill.cooldown * 60;
                    }
                });
            });
        }
    }
};
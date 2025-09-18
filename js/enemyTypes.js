// enemyTypes.js
export const EnemyTypes = {
    BASIC: {
        name: 'ベーシックエネミー',
        hp: 50,
        attack: 10,
        speed: 0.5,
        pointValue: 10,
        imagePath: 'assets/enemy.png',
        physicalDefense: 5,
        magicDefense: 5,
        attackType: 'physical'
    },
    FAST: {
        name: '高速エネミー',
        hp: 30,
        attack: 8,
        speed: 1.0,
        pointValue: 15,
        imagePath: 'assets/fast_enemy.png',
        physicalDefense: 3,
        magicDefense: 3,
        attackType: 'physical'
    },
    TANK: {
        name: 'タンクエネミー',
        hp: 200,
        attack: 15,
        speed: 0.3,
        pointValue: 30,
        imagePath: 'assets/tank_enemy.png',
        physicalDefense: 20,
        magicDefense: 10,
        attackType: 'physical'
    },
    MAGE_ENEMY: {
        name: '魔法エネミー',
        hp: 40,
        attack: 20,
        speed: 0.6,
        pointValue: 25,
        imagePath: 'assets/mage_enemy.png', // この画像はassetsフォルダに追加してください
        physicalDefense: 5,
        magicDefense: 15,
        attackType: 'magic'
    }
};
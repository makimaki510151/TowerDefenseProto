import Character from './character.js';
import Enemy from './enemy.js';

export default class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.field = this.createField(20, 15); // 20x15のマス目
        this.characters = [];
        this.enemies = [];

        this.spawnEnemyTimer = 0;
        this.spawnEnemyInterval = 100;

        this.placeInitialCharacter();
    }

    createField(cols, rows) {
        const field = [];
        for (let y = 0; y < rows; y++) {
            field[y] = [];
            for (let x = 0; x < cols; x++) {
                field[y][x] = { x, y, occupied: false };
            }
        }
        return field;
    }

    placeInitialCharacter() {
        // 例として、(5, 7)の位置にキャラクターを配置
        const character = new Character('Hero', 100, 10, { x: 5, y: 7 });
        this.characters.push(character);
        this.field[7][5].occupied = true;
    }

    update() {
        // 敵の生成
        this.spawnEnemyTimer++;
        if (this.spawnEnemyTimer >= this.spawnEnemyInterval) {
            this.enemies.push(new Enemy(100, 5, 1, { x: 0, y: Math.floor(Math.random() * this.field[0].length) }));
            this.spawnEnemyTimer = 0;
        }

        // キャラクターの更新（スキル発動など）
        this.characters.forEach(char => char.update(this.enemies));

        // 敵の更新（移動）
        this.enemies.forEach(enemy => enemy.update());

        // 敵とキャラクターの衝突判定
        this.characters.forEach(char => {
            this.enemies.forEach(enemy => {
                const distance = Math.sqrt(Math.pow(char.position.x - enemy.position.x, 2) + Math.pow(char.position.y - enemy.position.y, 2));
                if (distance < 1.0) { // マス目が重なったら
                    // 衝突処理
                }
            });
        });

        // 撃破された敵を配列から削除
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    }

    draw() {
        // 画面をクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const gridSize = 40;

        // マス目の描画
        for (let y = 0; y < this.field.length; y++) {
            for (let x = 0; x < this.field[y].length; x++) {
                this.ctx.strokeStyle = '#ccc';
                this.ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
            }
        }

        // キャラクターの描画
        this.characters.forEach(char => {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(char.position.x * gridSize, char.position.y * gridSize, gridSize, gridSize);
        });

        // 敵の描画
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(enemy.position.x * gridSize, enemy.position.y * gridSize, gridSize, gridSize);
        });
    }
}
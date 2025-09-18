import Character from './character.js';
import Enemy from './enemy.js';

export default class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.field = this.createField(20, 15);
        this.characters = [];
        this.enemies = [];
        this.points = 100; // ポイントを追加
        this.gridSize = 40;

        this.spawnEnemyTimer = 0;
        this.spawnEnemyInterval = 100;

        this.selectedCharacter = null; // 選択中のキャラクター

        this.setupEventListeners();
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

    setupEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const gridX = Math.floor(mouseX / this.gridSize);
            const gridY = Math.floor(mouseY / this.gridSize);

            this.placeCharacter(gridX, gridY);
        });
    }

    placeCharacter(x, y) {
        if (!this.selectedCharacter) {
            console.log('キャラクターが選択されていません。');
            return;
        }

        if (this.field[y][x].occupied) {
            console.log('そのマスには既にキャラクターがいます。');
            return;
        }

        if (this.points < this.selectedCharacter.cost) {
            console.log('ポイントが足りません！');
            return;
        }

        // ポイントを消費
        this.points -= this.selectedCharacter.cost;
        document.getElementById('points-display').textContent = this.points;

        // キャラクターを配置
        const newChar = new Character(
            this.selectedCharacter.name,
            this.selectedCharacter.hp,
            this.selectedCharacter.attack,
            { x, y },
            this.selectedCharacter.cost
        );
        this.characters.push(newChar);
        this.field[y][x].occupied = true;

        // 配置後、選択状態を解除
        this.selectedCharacter = null;
        document.querySelectorAll('.char-button').forEach(btn => btn.classList.remove('selected'));
    }

    update() {
        // 敵の生成
        this.spawnEnemyTimer++;
        if (this.spawnEnemyTimer >= this.spawnEnemyInterval) {
            this.enemies.push(new Enemy(100, 5, 1, { x: 0, y: Math.floor(Math.random() * this.field[0].length) }, 10)); // 撃破で10ポイント獲得
            this.spawnEnemyTimer = 0;
        }

        // キャラクターの更新
        this.characters.forEach(char => char.update(this.enemies));

        // 敵の更新
        this.enemies.forEach(enemy => enemy.update());

        // 敵の撃破判定とポイント付与
        const initialEnemyCount = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
        const defeatedEnemyCount = initialEnemyCount - this.enemies.length;
        if (defeatedEnemyCount > 0) {
            this.points += 10 * defeatedEnemyCount; // 敵を倒すと10ポイント獲得
            document.getElementById('points-display').textContent = this.points;
        }
    }

    draw() {
        // 画面をクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // マス目の描画
        for (let y = 0; y < this.field.length; y++) {
            for (let x = 0; x < this.field[y].length; x++) {
                this.ctx.strokeStyle = '#ccc';
                this.ctx.strokeRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
            }
        }

        // キャラクターの描画
        this.characters.forEach(char => {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(char.position.x * this.gridSize, char.position.y * this.gridSize, this.gridSize, this.gridSize);
        });

        // 敵の描画
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(enemy.position.x * this.gridSize, enemy.position.y * this.gridSize, this.gridSize, this.gridSize);
        });
    }
}
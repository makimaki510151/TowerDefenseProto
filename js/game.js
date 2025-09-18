import Character from './character.js';
import Enemy from './enemy.js';

export default class Game {
    // 敵の画像を引数として追加
    constructor(canvas, ctx, enemyImage) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.field = this.createField(20, 15);
        this.characters = [];
        this.enemies = [];
        this.points = 100;
        this.gridSize = 40;
        this.spawnEnemyTimer = 0;
        this.spawnEnemyInterval = 100;
        this.selectedCharacter = null;
        this.enemyImage = enemyImage; // 敵画像をプロパティに保存

        this.setupEventListeners();
    }

    // ... (他のメソッドは変更なし)

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

        this.points -= this.selectedCharacter.cost;
        document.getElementById('points-display').textContent = this.points;

        const newChar = new Character(
            this.selectedCharacter.name,
            this.selectedCharacter.hp,
            this.selectedCharacter.attack,
            { x, y },
            this.selectedCharacter.cost,
            this.selectedCharacter.image // ここで画像を渡す
        );
        this.characters.push(newChar);
        this.field[y][x].occupied = true;

        this.selectedCharacter = null;
        document.querySelectorAll('.char-button').forEach(btn => btn.classList.remove('selected'));
    }

    update() {
        // 敵の生成
        this.spawnEnemyTimer++;
        if (this.spawnEnemyTimer >= this.spawnEnemyInterval) {
            // 敵の生成時に画像を渡す
            this.enemies.push(new Enemy(100, 5, 1, { x: 0, y: Math.floor(Math.random() * this.field[0].length) }, 10, this.enemyImage));
            this.spawnEnemyTimer = 0;
        }

        // ... (他の更新ロジック)
    }

    draw() {
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
            if (char.image) {
                this.ctx.drawImage(char.image, char.position.x * this.gridSize, char.position.y * this.gridSize, this.gridSize, this.gridSize);
            } else {
                this.ctx.fillStyle = 'blue';
                this.ctx.fillRect(char.position.x * this.gridSize, char.position.y * this.gridSize, this.gridSize, this.gridSize);
            }
        });

        // 敵の描画
        this.enemies.forEach(enemy => {
            if (enemy.image) {
                this.ctx.drawImage(enemy.image, enemy.position.x * this.gridSize, enemy.position.y * this.gridSize, this.gridSize, this.gridSize);
            } else {
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(enemy.position.x * this.gridSize, enemy.position.y * this.gridSize, this.gridSize, this.gridSize);
            }
        });
    }
}
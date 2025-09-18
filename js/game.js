import Character from './character.js';
import Enemy from './enemy.js';

export default class Game {
    constructor(canvas, ctx, enemyImage) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.characters = [];
        this.enemies = [];
        this.points = 100;
        this.spawnEnemyTimer = 0;
        this.spawnEnemyInterval = 100;
        this.selectedCharacter = null;
        this.enemyImage = enemyImage;

        this.messages = [];
        this.maxMessages = 5;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.placeCharacter(mouseX, mouseY);
        });
    }

    addMessage(message) {
        this.messages.push(message);
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
    }

    placeCharacter(x, y) {
        if (!this.selectedCharacter) {
            console.log('キャラクターが選択されていません。');
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
            this.selectedCharacter.image
        );
        this.characters.push(newChar);

        this.selectedCharacter = null;
        document.querySelectorAll('.char-button').forEach(btn => btn.classList.remove('selected'));
    }

    update() {
        this.spawnEnemyTimer++;
        if (this.spawnEnemyTimer >= this.spawnEnemyInterval) {
            this.enemies.push(new Enemy(
                "Basic Enemy",
                100, 5, 1,
                { x: 0, y: Math.random() * this.canvas.height },
                10,
                this.enemyImage
            ));
            this.spawnEnemyTimer = 0;
        }

        this.characters.forEach(char => char.update(this.enemies, this));
        this.enemies.forEach(enemy => enemy.update());

        const initialEnemyCount = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
        const defeatedEnemyCount = initialEnemyCount - this.enemies.length;
        if (defeatedEnemyCount > 0) {
            this.points += 10 * defeatedEnemyCount;
            document.getElementById('points-display').textContent = this.points;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // キャラクターの描画
        this.characters.forEach(char => {
            const charSize = 40;
            if (char.image) {
                this.ctx.drawImage(char.image, char.position.x - charSize / 2, char.position.y - charSize / 2, charSize, charSize);
            } else {
                this.ctx.fillStyle = 'blue';
                this.ctx.fillRect(char.position.x - charSize / 2, char.position.y - charSize / 2, charSize, charSize);
            }
            // キャラクターのHP表示
            char.draw(this.ctx);
        });

        // 敵の描画
        this.enemies.forEach(enemy => {
            const enemySize = 40;
            if (enemy.image) {
                this.ctx.drawImage(enemy.image, enemy.position.x - enemySize / 2, enemy.position.y - enemySize / 2, enemySize, enemySize);
            } else {
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(enemy.position.x - enemySize / 2, enemy.position.y - enemySize / 2, enemySize, enemySize);
            }
            // 敵のHP表示
            enemy.draw(this.ctx);
        });

        // ログの描画
        this.ctx.fillStyle = 'black';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.messages.forEach((msg, index) => {
            this.ctx.fillText(msg, 10, this.canvas.height - 20 - (this.maxMessages - 1 - index) * 20);
        });
    }
}
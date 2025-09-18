// game.js
import Character from './character.js';
import Enemy from './enemy.js';
import Skill from './skill.js';
import DamageText from './damageText.js';

export default class Game {
    constructor(canvas, ctx, enemyImage) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.characters = [];
        this.enemies = [];
        this.points = 100;
        this.spawnEnemyTimer = 0;
        this.spawnEnemyInterval = 500;
        this.selectedCharacter = null;
        this.enemyImage = enemyImage;
        this.placedCharacters = new Set();

        this.logList = document.getElementById('log-list');
        this.maxLogItems = 100;

        this.damageTexts = [];
        this.isGameOver = false; // ゲームオーバーフラグを追加

        // 右端の壁のプロパティを追加
        this.wall = {
            hp: 2000,
            maxHp: 2000,
            position: { x: this.canvas.width - 20, y: this.canvas.height / 2 },
            width: 20,
            height: this.canvas.height,
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            if (this.isGameOver) return; // ゲームオーバー中はキャラクターを配置しない

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.placeCharacter(mouseX, mouseY);
        });
    }

    addMessage(message) {
        const li = document.createElement('li');
        li.textContent = message;

        // logListの先頭に新しい要素を追加
        this.logList.appendChild(li);

        // 古いログを削除
        if (this.logList.children.length > this.maxLogItems) {
            // 先頭要素を削除
            this.logList.removeChild(this.logList.lastChild);
        }
    }

    // ★ このメソッドを追加 ★
    addPoints(amount) {
        this.points += amount;
        document.getElementById('points-display').textContent = this.points;
        this.addMessage(`${amount} ポイントを獲得しました！`);
    }

    placeCharacter(x, y) {
        if (!this.selectedCharacter) {
            console.log('キャラクターが選択されていません。');
            return;
        }

        // 同じキャラクタータイプがすでに配置されている場合は、配置を中止する
        if (this.placedCharacters.has(this.selectedCharacter.name)) {
            console.log('このキャラクターはすでに配置されています！');
            this.addMessage(`${this.selectedCharacter.name} はすでに配置済みです。`);
            return;
        }

        if (this.points < this.selectedCharacter.cost) {
            console.log('ポイントが足りません！');
            return;
        }

        this.points -= this.selectedCharacter.cost;
        document.getElementById('points-display').textContent = this.points;

        const characterSkills = this.selectedCharacter.skills.map(skillInfo => {
            return new Skill(skillInfo.name, skillInfo.power, this, skillInfo.cooldown, skillInfo.range);
        });
        const newChar = new Character(
            this.selectedCharacter.name,
            this.selectedCharacter.hp,
            this.selectedCharacter.attack,
            { x, y },
            this.selectedCharacter.cost,
            this.selectedCharacter.image,
            characterSkills
        );
        this.characters.push(newChar);

        // 新しく配置したキャラクターの名前をセットに追加
        this.placedCharacters.add(newChar.name);

        this.selectedCharacter = null;
        document.querySelectorAll('.char-button').forEach(btn => btn.classList.remove('selected'));
    }

    // 更新メソッドを修正
    update() {
        if (this.isGameOver) {
            return;
        }

        this.spawnEnemyTimer++;
        if (this.spawnEnemyTimer >= this.spawnEnemyInterval) {
            this.spawnEnemyTimer = 0;
            this.spawnEnemy();
        }

        // キャラクターと敵の更新
        this.characters.forEach(char => char.update(this.enemies, this));
        // 敵のアップデートにキャラクターリストと壁の情報を渡す
        this.enemies.forEach(enemy => enemy.update(this.characters, this.wall, this));

        // 敵の削除（HPが0以下になった敵）
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);

        // 死亡したキャラクターはリストから削除し、その名前を placedCharacters からも削除する
        this.characters = this.characters.filter(char => {
            if (char.hp <= 0) {
                // キャラクターが死亡した場合、placedCharacters から削除
                this.placedCharacters.delete(char.name);
                return false; // リストから削除
            }
            return true;
        });

        // ダメージテキストの更新
        this.damageTexts.forEach(text => text.update());
        this.damageTexts = this.damageTexts.filter(text => text.life > 0);

        // ゲームオーバーの判定
        if (this.wall.hp <= 0) {
            this.isGameOver = true;
            this.addMessage('ゲームオーバー！');
        }
    }

    spawnEnemy() {
        const x = 0 - this.enemyImage.width;
        const y = Math.random() * (this.canvas.height - 40) + 20;
        const newEnemy = new Enemy(
            '敵', 100, 10, 0.5, { x, y }, 10, this.enemyImage, this
        );
        this.enemies.push(newEnemy);
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
            enemy.draw(this.ctx);
            // 敵が画面外にいるときに矢印を描画
            this.drawOffscreenArrow(enemy);
        });

        // ダメージテキストの描画
        this.damageTexts.forEach(text => text.draw(this.ctx));

        // 壁の描画
        this.ctx.fillStyle = 'grey';
        this.ctx.fillRect(this.wall.position.x, 0, this.wall.width, this.wall.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Wall HP: ${Math.max(0, this.wall.hp)}`, this.canvas.width - 30, 30); // HPがマイナスにならないように表示

        // ゲームオーバー表示
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    drawOffscreenArrow(enemy) {
        if (enemy.position.x < 0) {
            this.ctx.fillStyle = 'black';
            this.ctx.beginPath();
            const arrowSize = 15;
            const xPos = 10; // キャンバスの左端から少し離す
            const yPos = enemy.position.y;
            // 左向きの矢印を描画
            this.ctx.moveTo(xPos + arrowSize, yPos - arrowSize / 2);
            this.ctx.lineTo(xPos, yPos);
            this.ctx.lineTo(xPos + arrowSize, yPos + arrowSize / 2);
            this.ctx.fill();

            // 敵の残りHPを表示
            this.ctx.fillStyle = 'red';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`HP: ${enemy.hp}`, xPos + arrowSize + 5, yPos + 5);
        }
    }
}
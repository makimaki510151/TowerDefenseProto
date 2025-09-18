// game.js
import Character from './character.js';
import Enemy from './enemy.js';
import Skill from './skill.js';
import DamageText from './damageText.js';
import { CharacterTypes, PassiveTypes } from './character.js';
import { EnemyTypes } from './enemyTypes.js';

export default class Game {
    constructor(canvas, ctx, enemyImages) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.characters = [];
        this.enemies = [];
        this.spawnEnemyTimer = 0;
        this.spawnEnemyInterval = 100;
        this.enemyImages = enemyImages;
        this.placedCharacters = new Set();
        this.selectedParty = [];
        this.selectedCharacter = null;
        this.logList = document.getElementById('log-list');
        this.maxLogItems = 100;

        this.damageTexts = [];
        this.isGameOver = false;

        this.currentPhase = 'passiveSelection';
        this.currentWaveIndex = 0;
        this.currentWaveConfigIndex = 0;

        this.waveData = [
            [{ type: 'BASIC', count: 5, interval: 100 }],
            [{ type: 'random', types: ['BASIC', 'FAST'], count: 10, interval: 60 }],
            [{ type: 'BASIC', count: 5, interval: 50 }, { type: 'FAST', count: 5, interval: 40 }, { type: 'TANK', count: 3, interval: 80 }]
        ];

        this.enemiesToSpawnInCurrentConfig = 0;
        this.selectedPassive = null;
        this.isWaveInProgress = false;
        this.hasAppliedPassive = false;

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
            if (this.currentPhase !== 'placement' || this.isWaveInProgress) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.placeCharacter(mouseX, mouseY);
        });
    }

    addMessage(message) {
        const li = document.createElement('li');
        li.textContent = message;
        this.logList.appendChild(li);
        if (this.logList.children.length > this.maxLogItems) {
            this.logList.removeChild(this.logList.lastChild);
        }
    }

    placeCharacter(x, y) {
        if (!this.selectedCharacter) {
            this.addMessage('配置するキャラクターを選択してください。');
            return;
        }
        if (this.characters.length >= this.selectedParty.length) {
            this.addMessage('すべてのパーティーメンバーが配置されました。');
            return;
        }

        const newChar = new Character(
            this.selectedCharacter.name,
            this.selectedCharacter.hp,
            this.selectedCharacter.attack,
            this.selectedCharacter.magicAttack,
            this.selectedCharacter.physicalDefense,
            this.selectedCharacter.magicDefense,
            this.selectedCharacter.attackRange, // 追加
            this.selectedCharacter.attackSpeed, // 追加
            { x, y },
            this.selectedCharacter.image,
            this.selectedCharacter.skills,
            this
        );
        this.characters.push(newChar);
        this.addMessage(`${newChar.name} を配置しました。残り ${this.selectedParty.length - this.characters.length} 体`);

        this.selectedCharacter = null;
        document.querySelectorAll('.placement-char-icon').forEach(icon => icon.classList.remove('selected'));
    }

    selectPassive(passiveKey) {
        this.selectedPassive = passiveKey;
        if (PassiveTypes[passiveKey]) {
            this.addMessage(`${PassiveTypes[passiveKey].name} を選択しました。`);
        } else {
            console.error('無効なパッシブスキルが選択されました。');
        }
    }

    toggleCharacterInParty(charType) {
        const index = this.selectedParty.indexOf(charType);
        if (index > -1) {
            this.selectedParty.splice(index, 1);
            this.addMessage(`${charType.name} をパーティーから外しました。`);
        } else if (this.selectedParty.length < 4) {
            this.selectedParty.push(charType);
            this.addMessage(`${charType.name} をパーティーに加えました。`);
        } else {
            this.addMessage('パーティーは4体までです。');
        }
    }

    applyPassiveToCharacters() {
        if (this.selectedPassive && !this.hasAppliedPassive) {
            PassiveTypes[this.selectedPassive].apply(this.characters);
            this.hasAppliedPassive = true;
            this.addMessage('選択したパッシブスキルが適用されました。');
        }
    }

    startNextWave() {
        if (this.currentWaveIndex >= this.waveData.length) {
            this.addMessage('すべてのウェーブをクリアしました！');
            this.isGameOver = true;
            return;
        }

        this.currentPhase = 'placement';
        this.isWaveInProgress = false;
        this.characters = [];
        this.enemies = [];
        this.damageTexts = [];
        this.hasAppliedPassive = false;
        this.addMessage(`ウェーブ ${this.currentWaveIndex + 1} 開始！キャラクターを再配置してください。`);
    }

    startBattlePhase() {
        if (!this.hasAppliedPassive) {
            this.applyPassiveToCharacters();
        }
        this.currentPhase = 'battle';
        document.getElementById('game-phase-display').textContent = '戦闘中';
        this.isWaveInProgress = true;
        this.currentWaveConfigIndex = 0;
        this.enemiesToSpawnInCurrentConfig = 0;
        this.spawnEnemyTimer = 0;
        this.addMessage(`ウェーブ ${this.currentWaveIndex + 1} の戦闘開始！`);
    }

    update() {
        if (this.isGameOver || this.currentPhase !== 'battle' || !this.isWaveInProgress) {
            return;
        }

        const currentWaveConfig = this.waveData[this.currentWaveIndex];
        const currentEnemyTypeConfig = currentWaveConfig[this.currentWaveConfigIndex];

        if (currentEnemyTypeConfig && this.enemiesToSpawnInCurrentConfig < currentEnemyTypeConfig.count) {
            this.spawnEnemyTimer++;
            if (this.spawnEnemyTimer >= this.spawnEnemyInterval) {
                this.spawnEnemyTimer = 0;
                this.spawnEnemy();
            }
        }

        this.characters.forEach(char => char.update(this.enemies)); // 修正不要
        this.enemies.forEach(enemy => enemy.update(this.characters, this.wall, this));

        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
        this.characters = this.characters.filter(char => char.hp > 0);
        this.damageTexts.forEach(text => text.update());
        this.damageTexts = this.damageTexts.filter(text => text.life > 0);

        const totalEnemiesInWave = currentWaveConfig.reduce((sum, config) => sum + config.count, 0);

        if (this.enemies.length === 0 && this.currentWaveConfigIndex >= currentWaveConfig.length) {
            this.isWaveInProgress = false;
            this.addMessage(`ウェーブ ${this.currentWaveIndex + 1} クリア！`);
            this.currentWaveIndex++;

            if (this.currentWaveIndex < this.waveData.length) {
                this.startNextWave();
            } else {
                this.addMessage('すべてのウェーブをクリアしました！');
                this.isGameOver = true;
            }
        }

        if (this.wall.hp <= 0) {
            this.isGameOver = true;
            this.addMessage('ゲームオーバー！');
        }
    }

    spawnEnemy() {
        const waveConfig = this.waveData[this.currentWaveIndex];
        const currentEnemyConfig = waveConfig[this.currentWaveConfigIndex];

        if (!currentEnemyConfig) {
            return;
        }

        let enemyData;
        let enemyImage;

        if (currentEnemyConfig.type === 'random') {
            const randomTypeKey = currentEnemyConfig.types[Math.floor(Math.random() * currentEnemyConfig.types.length)];
            enemyData = EnemyTypes[randomTypeKey];
            enemyImage = this.enemyImages[randomTypeKey.toLowerCase() + 'Enemy'];
            this.spawnEnemyInterval = currentEnemyConfig.interval;
        } else {
            enemyData = EnemyTypes[currentEnemyConfig.type];
            enemyImage = this.enemyImages[currentEnemyConfig.type.toLowerCase() + 'Enemy'];
            this.spawnEnemyInterval = currentEnemyConfig.interval;
        }

        if (!enemyData) {
            console.error(`Unknown enemy type: ${currentEnemyConfig.type}`);
            return;
        }

        const newEnemy = new Enemy(
            enemyData.name,
            enemyData.hp,
            enemyData.attack,
            enemyData.speed,
            { x: -50, y: Math.random() * this.canvas.height },
            enemyData.pointValue,
            enemyImage,
            this,
            enemyData.physicalDefense,
            enemyData.magicDefense,
            enemyData.attackType
        );
        this.enemies.push(newEnemy);

        this.enemiesToSpawnInCurrentConfig++;

        if (this.enemiesToSpawnInCurrentConfig >= currentEnemyConfig.count) {
            this.currentWaveConfigIndex++;
            this.enemiesToSpawnInCurrentConfig = 0;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentPhase === 'placement') {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

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

        this.enemies.forEach(enemy => {
            const enemySize = 40;
            if (enemy.image) {
                this.ctx.drawImage(enemy.image, enemy.position.x - enemySize / 2, enemy.position.y - enemySize / 2, enemySize, enemySize);
            } else {
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(enemy.position.x - enemySize / 2, enemy.position.y - enemySize / 2, enemySize, enemySize);
            }
            enemy.draw(this.ctx);
            this.drawOffscreenArrow(enemy);
        });

        this.damageTexts.forEach(text => text.draw(this.ctx));

        this.ctx.fillStyle = 'grey';
        this.ctx.fillRect(this.wall.position.x, 0, this.wall.width, this.wall.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Wall HP: ${Math.max(0, this.wall.hp)}`, this.canvas.width - 30, 30);

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
            const xPos = 10;
            const yPos = enemy.position.y;
            this.ctx.moveTo(xPos + arrowSize, yPos - arrowSize / 2);
            this.ctx.lineTo(xPos, yPos);
            this.ctx.lineTo(xPos + arrowSize, yPos + arrowSize / 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'red';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`HP: ${enemy.hp}`, xPos + arrowSize + 5, yPos + 5);
        }
    }
}
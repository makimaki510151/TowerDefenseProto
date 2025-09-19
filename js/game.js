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

        this.fieldEffects = [];

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

        // ドラッグ＆ドロップ関連のプロパティ
        this.draggedCharacter = null;
        this.draggedPosition = { x: 0, y: 0 };
    }

    addMessage(message) {
        const li = document.createElement('li');
        li.textContent = message;
        this.logList.appendChild(li);
        if (this.logList.children.length > this.maxLogItems) {
            this.logList.removeChild(this.logList.lastChild);
        }
    }

    placeCharacter(x, y, charType) {
        if (!charType) {
            this.addMessage('配置するキャラクターを選択してください。');
            return;
        }
        if (this.characters.length >= this.selectedParty.length) {
            this.addMessage('すべてのパーティーメンバーが配置されました。');
            return;
        }

        const newChar = new Character(
            charType.name,
            charType.hp,
            charType.attack,
            charType.magicAttack,
            charType.physicalDefense,
            charType.magicDefense,
            charType.attackRange,
            charType.attackSpeed,
            { x, y },
            charType.image,
            charType.skillsData,
            this
        );
        this.characters.push(newChar);
        this.addMessage(`${newChar.name} を配置しました。残り ${this.selectedParty.length - this.characters.length} 体`);

        const placementCharIcon = document.querySelector(`.placement-char-icon[data-char-type="${charType.name}"]`);
        if (placementCharIcon) {
            placementCharIcon.style.display = 'none';
        }
    }

    startDragging(charType) {
        this.draggedCharacter = charType;
    }

    updateDragPosition(x, y) {
        this.draggedPosition = { x, y };
    }

    endDragging() {
        this.draggedCharacter = null;
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
        this.isWaveInProgress = true;
        this.addMessage('戦闘開始！');
    }

    update() {
        if (this.isGameOver) return;

        if (this.currentPhase === 'battle' && this.isWaveInProgress) {
            this.characters.forEach(char => char.update(this.enemies));
            this.enemies.forEach(enemy => enemy.update(this.characters, this.wall, this));
            this.fieldEffects.forEach(effect => effect.update(this.enemies));

            this.fieldEffects = this.fieldEffects.filter(effect => effect.duration > 0);
            this.enemies = this.enemies.filter(enemy => enemy.isAlive);
            this.damageTexts = this.damageTexts.filter(text => text.life > 0);
            this.damageTexts.forEach(text => text.update());

            this.spawnEnemyTimer++;

            // ウェーブ進行ロジック
            if (this.currentWaveIndex < this.waveData.length) {
                const currentWaveConfig = this.waveData[this.currentWaveIndex][this.currentWaveConfigIndex];

                // 現在のConfigにまだスポーンする敵がいるかチェック
                if (currentWaveConfig && this.enemiesToSpawnInCurrentConfig < currentWaveConfig.count) {
                    if (this.spawnEnemyTimer >= currentWaveConfig.interval) {
                        this.spawnEnemy();
                        this.spawnEnemyTimer = 0;
                        this.enemiesToSpawnInCurrentConfig++;
                    }
                }
                // 現在のConfigの敵をすべてスポーンし終えたら、次のConfigへ
                else if (this.currentWaveConfigIndex < this.waveData[this.currentWaveIndex].length - 1) {
                    this.currentWaveConfigIndex++;
                    this.enemiesToSpawnInCurrentConfig = 0;
                    this.spawnEnemyTimer = 0; // 次のConfig開始前にタイマーをリセット
                }
                // 現在のウェーブの全Configが終了し、かつ敵が残っていない場合、次のウェーブへ
                else if (this.enemies.length === 0) {
                    this.addMessage(`ウェーブ ${this.currentWaveIndex + 1} 完了！`);
                    this.currentWaveIndex++;
                    this.currentWaveConfigIndex = 0; // 次のウェーブのためにConfig Indexをリセット
                    this.enemiesToSpawnInCurrentConfig = 0; // 次のウェーブのためにスポーン数をリセット
                    this.isWaveInProgress = false;
                    this.startNextWave();
                }
            } else if (this.enemies.length === 0 && this.isWaveInProgress) {
                this.addMessage('すべてのウェーブをクリアしました！');
                this.isGameOver = true;
            }

            if (this.wall.hp <= 0) {
                this.isGameOver = true;
                this.addMessage('ゲームオーバー！壁が破壊されました。');
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // プレースメントフェーズ中の範囲可視化
        if (this.currentPhase === 'placement' && this.draggedCharacter) {
            this.ctx.beginPath();
            this.ctx.arc(this.draggedPosition.x, this.draggedPosition.y, this.draggedCharacter.attackRange, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'red';
            this.ctx.stroke();

            this.draggedCharacter.skillsData.forEach(skillInfo => {
                if (skillInfo.range) {
                    this.ctx.beginPath();
                    this.ctx.arc(this.draggedPosition.x, this.draggedPosition.y, skillInfo.range, 0, 2 * Math.PI);
                    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
                    this.ctx.fill();
                    this.ctx.strokeStyle = 'blue';
                    this.ctx.stroke();
                }
            });

            this.ctx.drawImage(this.draggedCharacter.image, this.draggedPosition.x - 25, this.draggedPosition.y - 25, 50, 50);
        }

        this.characters.forEach(char => char.draw(this.ctx));

        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx);
            this.drawOffscreenArrow(enemy);
        });

        this.fieldEffects.forEach(effect => effect.draw(this.ctx));
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
            this.ctx.fillStyle = 'red'; // 矢印の色を赤に変更
            this.ctx.beginPath();
            const arrowSize = 15;
            const xPos = 10;
            const yPos = enemy.position.y;
            this.ctx.moveTo(xPos, yPos);
            this.ctx.lineTo(xPos + arrowSize, yPos - arrowSize / 2);
            this.ctx.lineTo(xPos + arrowSize, yPos + arrowSize / 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    spawnEnemy() {
        const currentEnemyConfig = this.waveData[this.currentWaveIndex][this.currentWaveConfigIndex];

        if (!currentEnemyConfig) {
            return;
        }

        let enemyTypeKey;
        if (currentEnemyConfig.type === 'random') {
            enemyTypeKey = currentEnemyConfig.types[Math.floor(Math.random() * currentEnemyConfig.types.length)];
        } else {
            enemyTypeKey = currentEnemyConfig.type;
        }

        const enemyData = EnemyTypes[enemyTypeKey];
        // 以下の行を修正しました。キーに 'Enemy' を追加します。
        const enemyImage = this.enemyImages[enemyTypeKey.toLowerCase() + 'Enemy'];

        if (!enemyData) {
            console.error(`Unknown enemy type: ${enemyTypeKey}`);
            return;
        }

        const newEnemy = new Enemy(
            enemyData.name,
            enemyData.hp,
            enemyData.attack,
            enemyData.speed,
            { x: -50, y: Math.random() * this.canvas.height },
            enemyData.pointValue,
            enemyImage, // 取得した画像データを直接渡す
            this,
            enemyData.physicalDefense,
            enemyData.magicDefense,
            enemyData.attackType
        );
        this.enemies.push(newEnemy);

        this.enemiesToSpawnInCurrentConfig++;
    }
}
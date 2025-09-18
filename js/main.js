import Game from './game.js';
import { CharacterTypes, PassiveTypes } from './character.js';
import { EnemyTypes } from './enemyTypes.js';

function preloadImages(imagePaths) {
    const images = {};
    let loadedCount = 0;
    const totalImages = Object.keys(imagePaths).length;

    return new Promise((resolve, reject) => {
        if (totalImages === 0) {
            resolve({});
            return;
        }

        for (const key in imagePaths) {
            const path = imagePaths[key];
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                images[key] = img;
                if (loadedCount === totalImages) {
                    resolve(images);
                }
            };
            img.onerror = () => reject(new Error(`画像の読み込みに失敗しました: ${path}`));
            img.src = path;
        }
    });
}

window.addEventListener('load', async () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const characterImagePaths = {
        mage: 'assets/mage.png',
        archer: 'assets/archer.png',
        sniper: 'assets/sniper.png',
        rei: 'assets/rei.png'
    };
    const enemyImagePaths = {
        basicEnemy: 'assets/enemy.png',
        fastEnemy: 'assets/fast_enemy.png',
        tankEnemy: 'assets/tank_enemy.png',
        mageEnemy: 'assets/mage_enemy.png'
    };

    try {
        const charImages = await preloadImages(characterImagePaths);
        const enemyImages = await preloadImages(enemyImagePaths);

        // キャラクタータイプに画像を割り当て
        CharacterTypes.MAGE.image = charImages.mage;
        CharacterTypes.ARCHER.image = charImages.archer;
        CharacterTypes.SNIPER.image = charImages.sniper;
        CharacterTypes.REI.image = charImages.rei;

        const game = new Game(canvas, ctx, enemyImages);

        // UI要素の取得
        const passivePanel = document.getElementById('passive-panel');
        const partyPanel = document.getElementById('party-panel');
        const placementPanel = document.getElementById('placement-panel');
        const gameContainer = document.getElementById('game-container');

        const passiveSelectionDiv = document.getElementById('passive-selection');
        const allCharactersDiv = document.getElementById('all-characters');
        const selectedPartyDiv = document.getElementById('selected-party');
        const placementCharList = document.getElementById('placement-char-list');

        const nextToPartyButton = document.getElementById('next-to-party-button');
        const nextToPlacementButton = document.getElementById('next-to-placement-button');
        const startGameButton = document.getElementById('start-game-button');

        // --- パッシブスキル選択フェーズ ---
        // UIの生成とイベントリスナーの設定
        for (const passiveKey in PassiveTypes) {
            const passive = PassiveTypes[passiveKey];
            const button = document.createElement('button');
            button.classList.add('passive-button');
            button.textContent = passive.name;
            button.title = passive.description;
            button.addEventListener('click', () => {
                game.selectPassive(passiveKey); // キーを渡すように修正
                document.querySelectorAll('.passive-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            });
            passiveSelectionDiv.appendChild(button);
        }

        // パッシブ選択完了後、パーティー編成画面へ
        nextToPartyButton.addEventListener('click', () => {
            if (game.selectedPassive) {
                passivePanel.style.display = 'none';
                partyPanel.style.display = 'flex';
                // パーティー編成UIを生成
                if (allCharactersDiv.children.length === 0) {
                    Object.values(CharacterTypes).forEach(charType => {
                        const button = document.createElement('div');
                        button.classList.add('party-char-button');
                        button.textContent = charType.name;
                        button.addEventListener('click', () => {
                            game.toggleCharacterInParty(charType);
                            updatePartyUI();
                        });
                        allCharactersDiv.appendChild(button);
                    });
                }
            } else {
                alert('パッシブスキルを選択してください！');
            }
        });

        // パーティー編成UIの更新
        function updatePartyUI() {
            selectedPartyDiv.innerHTML = '';
            game.selectedParty.forEach(charType => {
                const charDiv = document.createElement('div');
                charDiv.textContent = charType.name;
                charDiv.classList.add('party-member');
                selectedPartyDiv.appendChild(charDiv);
            });
            document.querySelectorAll('.party-char-button').forEach(btn => {
                const charName = btn.textContent;
                const isSelected = game.selectedParty.some(char => char.name === charName);
                if (isSelected) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }

        // --- パーティー編成フェーズ ---
        // パーティー編成完了後、配置画面へ
        nextToPlacementButton.addEventListener('click', () => {
            if (game.selectedParty.length > 0) {
                partyPanel.style.display = 'none';
                placementPanel.style.display = 'flex';
                gameContainer.style.display = 'block';
                game.currentPhase = 'placement';
                updatePlacementUI();
            } else {
                alert('パーティーメンバーを編成してください！');
            }
        });

        // 配置UIの更新
        function updatePlacementUI() {
            placementCharList.innerHTML = '';
            game.selectedParty.forEach(charType => {
                const charDiv = document.createElement('div');
                charDiv.classList.add('placement-char-icon');

                // 画像と名前を表示
                if (charType.image) {
                    const charImg = document.createElement('img');
                    charImg.src = charType.image.src;
                    charImg.alt = charType.name;
                    charDiv.appendChild(charImg);
                }
                const charNameSpan = document.createElement('span');
                charNameSpan.textContent = charType.name;
                charDiv.appendChild(charNameSpan);

                charDiv.addEventListener('click', () => {
                    game.selectedCharacter = charType;
                    document.querySelectorAll('.placement-char-icon').forEach(icon => icon.classList.remove('selected'));
                    charDiv.classList.add('selected');
                });
                placementCharList.appendChild(charDiv);
            });
        }

        // --- キャラクター配置フェーズ ---
        // 配置完了後、ゲーム開始
        startGameButton.addEventListener('click', () => {
            if (game.characters.length === game.selectedParty.length) {
                placementPanel.style.display = 'none';
                game.startBattlePhase();
            } else {
                alert('すべてのキャラクターを配置してください！');
            }
        });

        let hasUpdatedPlacementUI = false;

        function gameLoop() {
            game.update();
            game.draw();
            // 配置フェーズに移行した際、UIを切り替える
            if (game.currentPhase === 'placement' && game.isWaveInProgress === false) {
                if (!hasUpdatedPlacementUI) {
                    passivePanel.style.display = 'none'; // パッシブパネルを隠す
                    partyPanel.style.display = 'none'; // パーティーパネルを隠す
                    placementPanel.style.display = 'flex';
                    gameContainer.style.display = 'block';
                    updatePlacementUI();
                    hasUpdatedPlacementUI = true;
                }
            } else if (game.currentPhase === 'battle' && game.isWaveInProgress === true) {
                placementPanel.style.display = 'none';
                if (hasUpdatedPlacementUI) {
                    hasUpdatedPlacementUI = false;
                }
            }
            requestAnimationFrame(gameLoop);
        }

        gameLoop();

    } catch (error) {
        console.error('画像の読み込みに失敗しました:', error);
    }
});
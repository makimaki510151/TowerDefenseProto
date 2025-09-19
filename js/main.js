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
        rei: 'assets/rei.png',
        mafi: 'assets/mafi.png',
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
        CharacterTypes.MAFI.image = charImages.mafi;

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

        // ドラッグ＆ドロップ関連の状態変数
        let isDragging = false;
        let dragTargetChar = null;
        let dragTargetImage = null;

        // --- UI更新関数 ---
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

        function updatePlacementUI() {
            placementCharList.innerHTML = '';
            game.selectedParty.forEach(charType => {
                const iconDiv = document.createElement('div');
                iconDiv.classList.add('placement-char-icon');
                iconDiv.dataset.charType = charType.name;
                
                const iconImg = document.createElement('img');
                iconImg.src = charType.image.src;
                iconDiv.appendChild(iconImg);

                const charNameSpan = document.createElement('span');
                charNameSpan.textContent = charType.name;
                iconDiv.appendChild(charNameSpan);

                iconDiv.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    if (game.characters.length >= game.selectedParty.length) return;
                    isDragging = true;
                    dragTargetChar = charType;
                    dragTargetImage = iconImg;
                    game.startDragging(dragTargetChar);
                    iconDiv.style.opacity = '0.5';
                    iconDiv.style.cursor = 'grabbing';
                });

                placementCharList.appendChild(iconDiv);
            });
        }

        // ドラッグイベントリスナー
        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            game.updateDragPosition(mouseX, mouseY);
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            game.endDragging();

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (dragTargetChar) {
                game.placeCharacter(mouseX, mouseY, dragTargetChar);
                if (dragTargetImage) {
                    dragTargetImage.parentElement.style.opacity = '1';
                    dragTargetImage.parentElement.style.cursor = 'grab';
                }
            }
            dragTargetChar = null;
            dragTargetImage = null;
        });


        // --- パッシブスキル選択フェーズ ---
        for (const passiveKey in PassiveTypes) {
            const passive = PassiveTypes[passiveKey];
            const button = document.createElement('button');
            button.classList.add('passive-button');
            button.textContent = passive.name;
            button.title = passive.description;
            button.addEventListener('click', () => {
                game.selectPassive(passiveKey);
                document.querySelectorAll('.passive-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            });
            passiveSelectionDiv.appendChild(button);
        }

        nextToPartyButton.addEventListener('click', () => {
            if (game.selectedPassive) {
                passivePanel.style.display = 'none';
                partyPanel.style.display = 'flex';
                updatePartyUI();
            } else {
                alert('パッシブスキルを選択してください！');
            }
        });

        // --- パーティー編成フェーズ ---
        for (const charType in CharacterTypes) {
            const char = CharacterTypes[charType];
            const button = document.createElement('div');
            button.classList.add('party-char-button');
            // char.imagePath が存在しないため、char.image.src を使用
            button.innerHTML = `<img src="${char.image.src}" alt="${char.name}" style="width: 50px; height: 50px;"><br>${char.name}`;
            button.title = char.description;
            button.addEventListener('click', () => {
                game.toggleCharacterInParty(char);
                updatePartyUI();
            });
            allCharactersDiv.appendChild(button);
        }

        nextToPlacementButton.addEventListener('click', () => {
            if (game.selectedParty.length > 0) {
                partyPanel.style.display = 'none';
                placementPanel.style.display = 'flex';
                gameContainer.style.display = 'block';
                updatePlacementUI();
                game.currentPhase = 'placement';
            } else {
                alert('パーティーメンバーを1体以上選択してください！');
            }
        });

        // --- キャラクター配置フェーズ ---
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
            if (game.currentPhase === 'placement' && game.isWaveInProgress === false) {
                if (!hasUpdatedPlacementUI) {
                    passivePanel.style.display = 'none';
                    partyPanel.style.display = 'none';
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
        console.error('画像の読み込み中にエラーが発生しました:', error);
    }
});
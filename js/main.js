import Game from './game.js';
import { CharacterTypes } from './character.js';

// 画像を事前に読み込む関数
function preloadImages(imagePaths) {
    const images = {};
    let loadedCount = 0;
    const totalImages = Object.keys(imagePaths).length;

    return new Promise((resolve, reject) => {
        // 画像がない場合でも解決する
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

    // 画像のパスを定義
    const characterImagePaths = {
        mage: 'assets/mage.png',
        archer: 'assets/archer.png'
    };
    const enemyImagePaths = {
        basicEnemy: 'assets/enemy.png'
    };

    try {
        // 画像を読み込み、待機
        const charImages = await preloadImages(characterImagePaths);
        const enemyImages = await preloadImages(enemyImagePaths);

        // キャラクタータイプに画像データを設定
        CharacterTypes.MAGE.image = charImages.mage;
        CharacterTypes.ARCHER.image = charImages.archer;

        // Gameクラスに敵の画像を渡す
        const game = new Game(canvas, ctx, enemyImages.basicEnemy);

        // キャラクター選択UIを生成
        const charSelection = document.getElementById('character-selection');
        Object.values(CharacterTypes).forEach(charType => {
            const button = document.createElement('div');
            button.classList.add('char-button');
            button.textContent = `${charType.name} (${charType.cost}pt)`;
            button.addEventListener('click', () => {
                game.selectedCharacter = charType;
                // ボタンの選択状態を更新
                document.querySelectorAll('.char-button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            });
            charSelection.appendChild(button);
        });

        // ゲームループ
        function gameLoop() {
            game.update();
            game.draw();
            requestAnimationFrame(gameLoop);
        }

        gameLoop();
    } catch (error) {
        console.error('画像の読み込みに失敗しました:', error);
    }
});
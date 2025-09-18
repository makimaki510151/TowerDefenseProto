import Game from './game.js';
import { CharacterTypes } from './character.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const game = new Game(canvas, ctx);

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
});
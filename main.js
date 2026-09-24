import { createTexture } from './utils.js';
import { setupBackground, drawBackground } from './Background/background.js';
import { setupEnemies, drawEnemies, enemyHits, removeDeadEnemies, spawnEnemy, updateEnemyPositions, enemyInformations, pointsState } from './Enemies/enemies.js';
import { setupDiamond, drawDiamonds, diamondInformations } from './Enemies/Diamond/diamond.js';
import { setupPlayer, drawPlayer, updatePlayerPosition, playerInformations, collectDiamonds } from './Player/player.js';
import { setupTower, drawTower, towerHit, towerInformations, towerType, stateTower, changeTowerType, isTowerActive } from './Tower/tower.js';
import { setupBar, drawBar } from './Tower/bar/bar.js';
import { setupProjectile, drawProjectiles, updateProjectiles, towerProjectileHit } from './Tower/Projectile/projectile.js';
import { setupTowerRange, drawRange, towerAreaHit } from './Tower/Range/range.js';

const canvas = document.querySelector('.canvas-tower-defense');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL não esta disponivel.');
    throw new Error('WebGL não suportado.');
}

function loadImage(path) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(createTexture(gl, image));
        image.onerror = () => reject(new Error(`Erro ao carregar: ${path}`));
        image.src = path;
    });
}

async function start() {
    const [backgroundTexture, enemySlime, enemySkeleton, enemyPig, diamondTexture, playerIdle, playerWalking, playerAttack, towerTexture, towerAreaTexture, projectileTexture] = await Promise.all([
        loadImage('./Img/background.png'),
        loadImage('./Img/slimeGreen.png'),
        loadImage('./Img/skeleton.png'),
        loadImage('./Img/pig.png'),
        loadImage('./Img/diamond.png'),
        loadImage('./Img/playerIdle.png'),
        loadImage('./Img/playerWalking.png'),
        loadImage('./Img/playerAttack.png'),
        loadImage('./Img/towerProjectile.png'),
        loadImage('./Img/towerArea.png'),
        loadImage('./Img/projectile.png')
    ]);

    const background = await setupBackground(gl);
    const enemies = await setupEnemies(gl);
    const diamonds = await setupDiamond(gl);
    const player = await setupPlayer(gl);
    const tower = await setupTower(gl);
    const projectile = await setupProjectile(gl);
    const range = await setupTowerRange(gl);
    const bar = await setupBar(gl);

    const enemyTextures = {
        slime: enemySlime,
        skeleton: enemySkeleton,
        pig: enemyPig
    };

    const playerTextures = {
        playerIdle: playerIdle,
        playerWalking: playerWalking,
        playerAttack: playerAttack
    };

    const fullScreenButton = document.getElementById('fullScreenButton');

    fullScreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Erro ao tentar entrar em tela cheia: ${err.message} (${err.name})`);
            });
            fullScreenButton.textContent = "❌";
        } else {
            document.exitFullscreen().catch((err) => {
                console.error(`Erro ao tentar sair da tela cheia: ${err.message} (${err.name})`);
            });
            fullScreenButton.innerHTML = `<img src="./Img/maxButton.png" alt="full screen">`;
        }
    });

    function resizeCanvas() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        canvas.width = size;
        canvas.height = size;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startScreen = document.getElementById('startScreen');
    const gameOver = document.getElementById('gameOver');

    let isGameOver = false;

    function startGame(type) {
        changeTowerType(type);
        startScreen.classList.add('hidden');
        towerInformations.currentFrame = 0;
        requestAnimationFrame(render);
    }

    document.getElementById('projectileTower').addEventListener('click', () => startGame('projectile'));
    document.getElementById('areaTower').addEventListener('click', () => startGame('area'));

    document.getElementById('projectileTowerRestart').addEventListener('click', () => {
        towerInformations.health = towerType.projectile.maxHealth;
        towerInformations.destroyed = false;
        towerInformations.currentFrame = 0;

        playerInformations.x = 0.4;
        playerInformations.y = 0.1;
        playerInformations.state = 'playerIdle';

        enemyInformations.length = 0;

        diamondInformations.length = 0;
        pointsState.gamePoints = 0;
        document.getElementById('points').innerText = 0;

        gameOver.classList.add('hidden');
        isGameOver = false;

        changeTowerType('projectile');
        requestAnimationFrame(render);
    });
    document.getElementById('areaTowerRestart').addEventListener('click', () => {
        towerInformations.health = towerType.area.maxHealth;
        towerInformations.destroyed = false;
        towerInformations.currentFrame = 0;

        playerInformations.x = 0.4;
        playerInformations.y = 0.1;
        playerInformations.state = 'playerIdle';

        enemyInformations.length = 0;

        diamondInformations.length = 0;
        pointsState.gamePoints = 0;
        document.getElementById('points').innerText = 0;

        gameOver.classList.add('hidden');
        isGameOver = false;

        changeTowerType('area');
        requestAnimationFrame(render);
    });

    function render(currentTime) {
        if (towerInformations.destroyed) {
            if (!isGameOver) {
                isGameOver = true;
                gameOver.classList.remove('hidden');
            }
            return;
        }

        let activeTowerTexture;

        if (stateTower.actveTower.attackType === 'projectile') {
            activeTowerTexture = towerTexture;
            towerProjectileHit(currentTime, towerInformations);
            updateProjectiles(currentTime);
        } else {
            activeTowerTexture = towerAreaTexture;
            towerAreaHit(currentTime, enemyInformations);
        }

        updatePlayerPosition();

        spawnEnemy(currentTime);
        updateEnemyPositions();
        enemyHits(currentTime);

        towerHit(currentTime);

        removeDeadEnemies();
        collectDiamonds();

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        drawBackground(gl, background, backgroundTexture);
        drawEnemies(gl, enemies, enemyTextures, currentTime);

        if (isTowerActive(currentTime) && stateTower.actveTower.attackType === 'area') {
            drawRange(gl, range, towerInformations.x, towerInformations.y, stateTower.actveTower.range);
        }

        drawPlayer(gl, player, playerTextures, currentTime);

        if (stateTower.actveTower.attackType === 'projectile') {
            drawProjectiles(gl, projectile, projectileTexture);
        }

        drawTower(gl, tower, activeTowerTexture, currentTime);
        drawDiamonds(gl, diamonds, diamondTexture, diamondInformations);
        drawBar(gl, bar, towerInformations.x, towerInformations.y + 0.3, towerInformations.health, stateTower.actveTower.maxHealth);

        requestAnimationFrame(render);
    }
}

try {
    await start();
} catch (error) {
    console.error(error);
}

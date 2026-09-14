import { createTexture } from './utils.js';
import { setupBackground, drawBackground } from './Background/background.js';
import { setupEnemies, drawEnemies } from './Enemies/enemies.js';
import { setupPlayer, drawPlayer } from './Player/player.js';
import { setupTower, drawTower } from './Tower/tower.js';

/* function ortho(left, right, bottom, top, near, far) {
  const tx = -(right + left) / (right - left)
  const ty = -(top + bottom) / (top - bottom)
  const tz = -(far + near) / (far - near)

  return new Float32Array([
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, -2 / (far - near), 0,
    tx, ty, tz, 1
  ])
} */

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
    const [backgroundTexture, enemyTexture, playerTexture, towerTexture] = await Promise.all([
        loadImage('./Img/background.png'),
        loadImage('./Img/slimeGreen.png'),
        loadImage('./Img/player.png'),
        loadImage('./Img/tower.png')
    ]);

    const background = await setupBackground(gl);
    const enemies = await setupEnemies(gl);
    const player = await setupPlayer(gl);
    const tower = await setupTower(gl);

    function render(currentTime) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        drawBackground(gl, background, backgroundTexture);
        drawEnemies(gl, enemies, enemyTexture, currentTime);
        drawPlayer(gl, player, playerTexture);
        drawTower(gl, tower, towerTexture);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

try {
    await start();
} catch (error) {
    console.error(error);
}

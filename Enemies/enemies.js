import { createProgram, createShader } from '../utils.js';
import { playerInformations, collisionDetection, attackCollision, playerCollision } from '../Player/player.js';
import { towerInformations } from '../Tower/tower.js';

export const enemyInformations = [];

export async function setupEnemies(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./Enemies/vertexShaderEnemy.glsl'),
        fetch('./Enemies/fragmentShaderEnemy.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'enemy vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'enemy fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, 'position');
    const texturePositionLocation = gl.getAttribLocation(program, 'texturePosition');

    const vertices = new Float32Array([
        -1, -1, 0, 0,
        1, -1, 1, 0,
        -1, 1, 0, 1,
        -1, 1, 0, 1,
        1, -1, 1, 0,
        1, 1, 1, 1
    ]);

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texturePositionLocation);
    gl.vertexAttribPointer(texturePositionLocation, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);

    return {
        program,
        vao,
        textureLocation: gl.getUniformLocation(program, 'enemyTexture'),
        positionLocation: gl.getUniformLocation(program, 'enemyPosition'),
        sizeLocation: gl.getUniformLocation(program, 'enemySize'),
        frameDislocationLocation: gl.getUniformLocation(program, 'enemyFrameDislocation'),
        frameScaleLocation: gl.getUniformLocation(program, 'enemyFrameScale')
    };
}

const configFrames = {
    slime: { frames: 8, columns: 8, rows: 3, animationRow: 1, frameDuration: 100, health: 30 },
    skeleton: { frames: 6, columns: 6, rows: 10, animationRow: 5, frameDuration: 100, health: 50 },
    pig: { frames: 12, columns: 12, rows: 1, animationRow: 0, frameDuration: 100, health: 40 }
};

const enemySize = {
    slime: { width: 0.20, height: 0.20 },
    skeleton: { width: 0.16, height: 0.16 },
    pig: { width: 0.10, height: 0.10 }
};

export const enemyCollision = {
    slime: { width: 0.20, height: 0.20, offsetY: 0.02 },
    skeleton: { width: 0.16, height: 0.24, offsetY: 0.05 },
    pig: { width: 0.14, height: 0.24, offsetY: 0.02 }
};

let spawnTime = 0;
const spawnInterval = 2000;
const enemySpeed = 0.002;
const towerStopDistance = 0.18;

export function spawnEnemy(currentTime) {
    if (currentTime - spawnTime > spawnInterval) {
        const enemyTypes = ['slime', 'skeleton', 'pig'];
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const startX = 1.2;
        const startY = (Math.random() * 1.6) - 0.8;

        const newEnemy = {
            [randomType]: {
                x: startX,
                y: startY,
                currentFrame: 0,
                time: currentTime,
                health: configFrames[randomType].health,
                attacking: 0,
                direction: -1
            }
        };
        enemyInformations.push(newEnemy);
        spawnTime = currentTime;
    }
}

export function updateEnemyPositions() {
    enemyInformations.forEach((enemyEntry) => {
        const [, enemy] = Object.entries(enemyEntry)[0];
        const distanceX = towerInformations.x - enemy.x;
        const distanceY = towerInformations.y - enemy.y;
        const distanceTower = Math.hypot(distanceX, distanceY);

        if (distanceTower > towerStopDistance) {
            const nextPosition = {
                x: enemy.x + (distanceX / distanceTower) * enemySpeed,
                y: enemy.y + (distanceY / distanceTower) * enemySpeed
            };
            const enemyPosition = {
                x: nextPosition.x,
                y: nextPosition.y + enemyCollision[Object.keys(enemyEntry)[0]].offsetY
            };
            const playerPosition = {
                x: playerInformations.x,
                y: playerInformations.y,
                width: playerCollision.player.width,
                height: playerCollision.player.height
            };

            if (!collisionDetection(enemyPosition, enemyCollision[Object.keys(enemyEntry)[0]], playerPosition)) {
                enemy.x = nextPosition.x;
                enemy.y = nextPosition.y;
            }
            if (distanceX < 0) {
                enemy.direction = -1;
            } else {
                enemy.direction = 1;
            }
        }
    });
}

export function enemyHits() {
    const playerPosition = {
        x: playerInformations.x,
        y: playerInformations.y,
        width: attackCollision.width,
        height: attackCollision.height
    };

    if (playerInformations.state === 'attacking') {
        enemyInformations.forEach((enemyEntry) => {
            const [type, enemy] = Object.entries(enemyEntry)[0];
            const collision = enemyCollision[type];

            const enemyCollisionPosition = {
                x: enemy.x,
                y: enemy.y + collision.offsetY,
            };

            if (collisionDetection(enemyCollisionPosition, collision, playerPosition) && enemy.attacking !== playerInformations.attacking) {
                enemy.health -= playerInformations.attack;
                enemy.attacking = playerInformations.attacking;
            }
        });
    }
}

export function removeDeadEnemies() {
    for (let i = enemyInformations.length - 1; i >= 0; i--) {
        const [, enemy] = Object.entries(enemyInformations[i])[0];

        if (enemy.health <= 0) {
            enemyInformations.splice(i, 1);
        }
    }
}

export function drawEnemies(gl, enemies, textures, currentTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(enemies.program);
    gl.bindVertexArray(enemies.vao);
    gl.activeTexture(gl.TEXTURE0);

    enemyInformations.forEach((enemyEntry) => {
        const [type, enemy] = Object.entries(enemyEntry)[0];
        const configType = configFrames[type];

        if ((currentTime - enemy.time) > configType.frameDuration) {
            enemy.currentFrame = (enemy.currentFrame + 1) % configType.frames;
            enemy.time = currentTime;
        }

        const frameDurationX = (enemy.currentFrame % configType.columns) / configType.columns;
        const frameDurationY = configType.animationRow / configType.rows;

        gl.uniform2f(enemies.frameScaleLocation, 1 / configType.columns, 1 / configType.rows);
        gl.uniform2f(enemies.frameDislocationLocation, frameDurationX, frameDurationY);
        gl.uniform2f(enemies.sizeLocation, (enemySize[type].width * enemy.direction), enemySize[type].height);

        gl.bindTexture(gl.TEXTURE_2D, textures[type]);
        gl.uniform1i(enemies.textureLocation, 0);

        gl.uniform2f(enemies.positionLocation, enemy.x, enemy.y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    });
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}

import { createProgram, createShader } from '../utils.js';
import { enemyInformations, enemyCollision } from '../Enemies/enemies.js';
import { towerPosition, towerCollision } from '../Tower/tower.js';

export const playerInformations = { x: 0.4, y: 0.1, currentFrame: 0, time: 0, speed: 0.01, direction: 1, state: 'playerWalking', attack: 10, attacking: 0 };

export async function setupPlayer(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./Player/vertexShaderPlayer.glsl'),
        fetch('./Player/fragmentShaderPlayer.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'player vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'player fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
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
        textureLocation: gl.getUniformLocation(program, 'playerTexture'),
        positionLocation: gl.getUniformLocation(program, 'playerPosition'),
        sizeLocation: gl.getUniformLocation(program, 'playerSize'),
        frameDislocationLocation: gl.getUniformLocation(program, 'playerFrameDislocation'),
        frameScaleLocation: gl.getUniformLocation(program, 'playerFrameScale')
    };
}

const configFrames = {
    playerIdle: { frames: 8, columns: 8, rows: 1, animationRow: 0, frameDuration: 100 },
    playerWalking: { frames: 6, columns: 6, rows: 1, animationRow: 0, frameDuration: 100 },
    playerAttack: { frames: 4, columns: 4, rows: 1, animationRow: 0, frameDuration: 100 }
};

const indicatesKey = {
    w: false,
    a: false,
    s: false,
    d: false
};

function attackPlayer() {
    if (playerInformations.state !== 'attacking') {
        playerInformations.state = 'attacking';
        playerInformations.currentFrame = 0;
        playerInformations.attacking++;
    }
}
export const attackCollision = {
    width: 0.15,
    height: 0.15,
};

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (event.code === 'Space') {
        attackPlayer();
        return;
    }

    if (Object.hasOwn(indicatesKey, key)) {
        event.preventDefault();
        indicatesKey[key] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();

    if (Object.hasOwn(indicatesKey, key)) {
        indicatesKey[key] = false;
    }
});

window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        attackPlayer();
    }
});

export function updatePlayerPosition() {
    let nextX = playerInformations.x;
    let nextY = playerInformations.y;

    if (indicatesKey.w) {
        nextY += playerInformations.speed;
    }
    if (indicatesKey.s) {
        nextY -= playerInformations.speed;
    }
    if (indicatesKey.a) {
        playerInformations.direction = -1;
        nextX -= playerInformations.speed;
    }
    if (indicatesKey.d) {
        playerInformations.direction = 1;
        nextX += playerInformations.speed;
    }

    const playerFuturePosition = {
        x: nextX,
        y: nextY,
        width: playerCollision.player.width,
        height: playerCollision.player.height
    };

    let hasCollision = false;

    for (const enemy of enemyInformations) {
        const enemyType = Object.keys(enemy)[0];
        const enemyPosition = enemy[enemyType];
        const enemiesCollision = enemyCollision[enemyType];

        const enemyCollisionPosition = {
            x: enemyPosition.x,
            y: enemyPosition.y + enemiesCollision.offsetY
        };

        if (collisionDetection(enemyCollisionPosition, enemiesCollision, playerFuturePosition)) {
            hasCollision = true;
            break;
        }
    }

    const towerCollisionPosition = {
        x: towerPosition.x,
        y: towerPosition.y + towerCollision.tower.offsetY
    };

    if (collisionDetection(towerCollisionPosition, towerCollision.tower, playerFuturePosition)) {
        hasCollision = true;
    }

    if (!hasCollision) {
        playerInformations.x = nextX;
        playerInformations.y = nextY;
    }
}

const playerSize = {
    player: { width: 0.26, height: 0.26 }
};

const playerCollision = {
    player: { width: 0.04, height: 0.04 }
};

export function collisionDetection(enemyPositions, enemyCollision, playerPosition) {
    const playerLeft = playerPosition.x - playerPosition.width / 2;
    const playerRight = playerPosition.x + playerPosition.width / 2;
    const playerTop = playerPosition.y + playerPosition.height / 2;
    const playerBottom = playerPosition.y - playerPosition.height / 2;

    const enemyLeft = enemyPositions.x - enemyCollision.width / 2;
    const enemyRight = enemyPositions.x + enemyCollision.width / 2;
    const enemyTop = enemyPositions.y + enemyCollision.height / 2;
    const enemyBottom = enemyPositions.y - enemyCollision.height / 2;

    return playerRight > enemyLeft && playerLeft < enemyRight && playerTop > enemyBottom && playerBottom < enemyTop;
}

export function drawPlayer(gl, player, textures, currentTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(player.program);
    gl.bindVertexArray(player.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(player.textureLocation, 0);
    gl.uniform2f(player.sizeLocation, (playerSize.player.width * playerInformations.direction), playerSize.player.height);
    gl.uniform2f(player.positionLocation, playerInformations.x, playerInformations.y);

    let currentStatePlayer;

    if (playerInformations.state === 'attacking') {
        currentStatePlayer = 'playerAttack';
    } else if (indicatesKey.w || indicatesKey.a || indicatesKey.s || indicatesKey.d) {
        currentStatePlayer = 'playerWalking';
    } else {
        currentStatePlayer = 'playerIdle';
    }

    const configType = configFrames[currentStatePlayer];
    const selectedTexture = textures[currentStatePlayer];

    gl.bindTexture(gl.TEXTURE_2D, selectedTexture);

    if ((currentTime - playerInformations.time) > configType.frameDuration) {
        playerInformations.currentFrame++;
        playerInformations.time = currentTime;

        if (playerInformations.currentFrame >= configType.frames) {
            if (playerInformations.state === 'attacking') {
                playerInformations.state = 'idle';
                playerInformations.currentFrame = 0;
            } else {
                playerInformations.currentFrame = 0;
            }
        }
    }

    const frameDurationX = (playerInformations.currentFrame % configType.columns) / configType.columns;
    const frameDurationY = configType.animationRow / configType.rows;

    gl.uniform2f(player.frameScaleLocation, 1 / configType.columns, 1 / configType.rows);
    gl.uniform2f(player.frameDislocationLocation, frameDurationX, frameDurationY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}

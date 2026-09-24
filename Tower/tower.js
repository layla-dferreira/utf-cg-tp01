import { createProgram, createShader } from '../utils.js';
import { enemyInformations, enemyCollision, enemySpeedAttack } from '../Enemies/enemies.js';
import { collisionDetection } from '../Player/player.js';

export const towerInformations = { x: 0.0, y: 0.2, currentFrame: 0, time: 0, health: 100, destroyed: false };

export async function setupTower(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./Tower/vertexShaderTower.glsl'),
        fetch('./Tower/fragmentShaderTower.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'tower vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'tower fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
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
        textureLocation: gl.getUniformLocation(program, 'towerTexture'),
        colorLocation: gl.getUniformLocation(program, 'towerColor'),
        positionLocation: gl.getUniformLocation(program, 'towerPosition'),
        sizeLocation: gl.getUniformLocation(program, 'towerSize'),
        frameDislocationLocation: gl.getUniformLocation(program, 'towerFrameDislocation'),
        frameScaleLocation: gl.getUniformLocation(program, 'towerFrameScale')
    };
}

const configFrames = {
    towerProjectile: { frames: 6, columns: 6, rows: 1, animationRow: 0, frameDuration: 100 },
    towerArea: { frames: 1, columns: 1, rows: 1, animationRow: 0 }
};

const towerSize = {
    towerProjectile: { width: 0.23, height: 0.36 },
    towerArea: { width: 0.16, height: 0.28 }
};

export const towerCollision = {
    towerProjectile: { width: 0.38, height: 0.50, offsetY: -0.12 },
    towerArea: { width: 0.38, height: 0.50, offsetY: -0.02 }
};

const attackInterval = 500;

export const towerType = {
    projectile: {
        x: 0.0,
        y: 0.2,
        health: 100,
        maxHealth: 100,
        range: 0.8,
        damage: 10,
        cooldown: 1000,
        fireTime: 0,
        speed: 0.01,
        attackType: 'projectile',
        destroyed: false
    },
    area: {
        x: 0.0,
        y: 0.2,
        health: 100,
        maxHealth: 100,
        range: 0.6,
        damage: 10,
        cooldown: 800,
        attackType: 'area',
        destroyed: false
    }
};

export const stateTower = {
    actveTower: towerType.projectile
};

export function changeTowerType(type) {
    if (towerType[type]) {
        stateTower.actveTower = towerType[type];
    }
}

export function towerHit(currentTime) {
    let towerCollisionType
    if (stateTower.actveTower.attackType === 'area') {
        towerCollisionType = towerCollision.towerArea;
    } else {
        towerCollisionType = towerCollision.towerProjectile;
    }

    const towerPosition = {
        x: towerInformations.x,
        y: towerInformations.y,
        width: towerCollisionType.width,
        height: towerCollisionType.height
    };

    enemyInformations.forEach((enemyEntry) => {
        const [type, enemy] = Object.entries(enemyEntry)[0];
        const collision = enemyCollision[type];

        const enemyCollisionPosition = {
            x: enemy.x,
            y: enemy.y + collision.offsetY,
        };

        if (collisionDetection(enemyCollisionPosition, collision, towerPosition) && enemy.health > 0 && currentTime - (enemy.attackTime || 0) >= attackInterval) {
            towerInformations.health -= enemySpeedAttack[type].attack;
            enemy.attackTime = currentTime;
        }
    });

    if (towerInformations.health <= 0) {
        towerInformations.health = 0;
        towerInformations.destroyed = true;
    }
}

export function isTowerActive(currentTime) {
    return (currentTime % 20000) < 10000;
}

export function drawTower(gl, tower, texture, currentTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(tower.program);
    gl.bindVertexArray(tower.vao);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(tower.textureLocation, 0);

    let towerSizeType, config;

    if (stateTower.actveTower.attackType === 'area') {
        towerSizeType = towerSize.towerArea;
        config = configFrames.towerArea;
    } else {
        towerSizeType = towerSize.towerProjectile;
        config = configFrames.towerProjectile;
    }

    gl.uniform2f(tower.sizeLocation, towerSizeType.width, towerSizeType.height);
    gl.uniform2f(tower.positionLocation, towerInformations.x, towerInformations.y);

    if ((currentTime - towerInformations.time) > config.frameDuration) {
        towerInformations.currentFrame = (towerInformations.currentFrame + 1) % config.frames;
        towerInformations.time = currentTime;
    }

    const frameDurationX = (towerInformations.currentFrame % config.columns) / config.columns;
    const frameDurationY = config.animationRow / config.rows;

    gl.uniform2f(tower.frameScaleLocation, 1 / config.columns, 1 / config.rows);
    gl.uniform2f(tower.frameDislocationLocation, frameDurationX, frameDurationY);

    if (stateTower.actveTower.attackType === 'projectile') {
        gl.uniform4f(tower.colorLocation, 0.6, 1.0, 0.85, 1.0);
    } else {
        gl.uniform4f(tower.colorLocation, 1.0, 1.0, 1.0, 1.0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}
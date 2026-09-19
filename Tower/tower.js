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
    tower: { frames: 6, columns: 6, rows: 1, animationRow: 0, frameDuration: 100 }
};

const towerSize = {
    tower: { width: 0.23, height: 0.36 }
};

export const towerCollision = {
    tower: { width: 0.38, height: 0.50, offsetY: -0.12 }
};

const attackInterval = 500;
export const towerMaxHealth = 100;

export const projectiles = [];
const towerState = {
    range: 1.0,
    damage: 10,
    cooldown: 1000,
    fireTime: 0,
    speed: 0.01
}

export function towerProjectileHit(currentTime, towerPosition) {
    if (currentTime - towerState.fireTime < towerState.cooldown) {
        return;
    }
    let closestEnemy = null;
    let closestDistance = towerState.range;

    enemyInformations.forEach((enemyEntry) => {
        const [, enemy] = Object.entries(enemyEntry)[0];
        const x = enemy.x - towerPosition.x;
        const y = enemy.y - towerPosition.y;
        const distance = Math.hypot(x, y);

        if (distance < closestDistance && enemy.health > 0) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    });

    if (closestEnemy !== null) {
        const nemProjectile = {
            x: towerPosition.x,
            y: towerPosition.y,
            target: closestEnemy,
            damage: towerState.damage,
        };
        projectiles.push(nemProjectile);
        towerState.fireTime = currentTime;
    }
}

export function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        const target = projectile.target;

        if (target.health <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        const x = target.x - projectile.x;
        const y = target.y - projectile.y;
        const distance = Math.hypot(x, y);

        if (distance < 0.1) {
            target.health -= projectile.damage;
            projectiles.splice(i, 1);
            continue;
        }

        const velocityX = (x / distance) * towerState.speed;
        const velocityY = (y / distance) * towerState.speed;

        projectile.x += velocityX;
        projectile.y += velocityY;
    }
}

export function towerHit(currentTime) {
    const towerPosition = {
        x: towerInformations.x,
        y: towerInformations.y,
        width: towerCollision.tower.width,
        height: towerCollision.tower.height
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

export function drawTower(gl, tower, texture, currentTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(tower.program);
    gl.bindVertexArray(tower.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(tower.textureLocation, 0);
    gl.uniform2f(tower.sizeLocation, towerSize.tower.width, towerSize.tower.height);
    gl.uniform2f(tower.positionLocation, towerInformations.x, towerInformations.y);

    if ((currentTime - towerInformations.time) > configFrames.tower.frameDuration) {
        towerInformations.currentFrame = (towerInformations.currentFrame + 1) % configFrames.tower.frames;
        towerInformations.time = currentTime;
    }

    const frameDurationX = (towerInformations.currentFrame % configFrames.tower.columns) / configFrames.tower.columns;
    const frameDurationY = configFrames.tower.animationRow / configFrames.tower.rows;

    gl.uniform2f(tower.frameScaleLocation, 1 / configFrames.tower.columns, 1 / configFrames.tower.rows);
    gl.uniform2f(tower.frameDislocationLocation, frameDurationX, frameDurationY);

    gl.uniform4f(tower.colorLocation, 0.6, 1.0, 0.85, 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}

export function drawProjectiles(gl, tower, texture) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(tower.program);
    gl.bindVertexArray(tower.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(tower.textureLocation, 0);
    gl.uniform2f(tower.sizeLocation, 0.05, 0.05);

    projectiles.forEach((projectile) => {
        gl.uniform2f(tower.positionLocation, projectile.x, projectile.y);
        gl.uniform2f(tower.frameScaleLocation, 1, 1);
        gl.uniform2f(tower.frameDislocationLocation, 0, 0);
        gl.uniform4f(tower.colorLocation, 0.9, 0.75, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}
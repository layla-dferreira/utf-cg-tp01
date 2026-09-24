import { createProgram, createShader } from '../../utils.js';
import { towerType, stateTower, isTowerActive, towerInformations } from '../tower.js';

export async function setupTowerRange(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./Tower/Range/vertexShaderRange.glsl'),
        fetch('./Tower/Range/fragmentShaderRange.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'range vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'range fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, 'position');

    const vertices = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1
    ]);

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);

    return {
        program,
        vao,
        positionLocation: gl.getUniformLocation(program, 'rangePosition'),
        sizeLocation: gl.getUniformLocation(program, 'rangeSize'),
    };
}

export function towerAreaHit(currentTime, enemyInformations) {
    if (stateTower.actveTower.attackType !== 'area') {
        return;
    }

    if (!isTowerActive(currentTime)) {
        return;
    }

    if (currentTime - towerType.projectile.fireTime < stateTower.actveTower.cooldown) {
        return;
    }

    let attaked = false;

    enemyInformations.forEach((enemyEntry) => {
        const [, enemy] = Object.entries(enemyEntry)[0];

        if (enemy.health > 0) {
            const x = enemy.x - towerInformations.x;
            const y = enemy.y - towerInformations.y;
            const distance = Math.hypot(x, y);

            if (distance <= stateTower.actveTower.range) {
                enemy.health -= stateTower.actveTower.damage;
                enemy.isHit = true;
                enemy.hitTime = currentTime;
                attaked = true;

            }
        }
    });

    if (attaked) {
        towerType.projectile.fireTime = currentTime;
    }
}

export function drawRange(gl, rangeObj, towerX, towerY, rangeRadius) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(rangeObj.program);
    gl.bindVertexArray(rangeObj.vao);

    gl.uniform2f(rangeObj.positionLocation, towerX, towerY);
    gl.uniform2f(rangeObj.sizeLocation, rangeRadius, rangeRadius);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}
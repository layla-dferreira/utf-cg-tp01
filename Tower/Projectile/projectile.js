import { createProgram, createShader } from '../../utils.js';
import { enemyInformations } from '../../Enemies/enemies.js';
import { towerType, stateTower } from '../tower.js';

export const projectiles = [];

export async function setupProjectile(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./Tower/Projectile/vertexShaderProjectile.glsl'),
        fetch('./Tower/Projectile/fragmentShaderProjectile.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'projectile vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'projectile fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
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
        textureLocation: gl.getUniformLocation(program, 'projectileTexture'),
        positionLocation: gl.getUniformLocation(program, 'projectilePosition'),
        sizeLocation: gl.getUniformLocation(program, 'projectileSize'),
        colorLocation: gl.getUniformLocation(program, 'projectileColor')
    };
}

export function towerProjectileHit(currentTime, towerPosition) {
    if (currentTime - towerType.projectile.fireTime < stateTower.actveTower.cooldown) {
        return;
    }
    let closestEnemy = null, closestDistance = towerType.projectile.range;

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
            damage: towerType.projectile.damage,
        };
        projectiles.push(nemProjectile);
        towerType.projectile.fireTime = currentTime;
    }
}

export function updateProjectiles(currentTime) {
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
            target.isHit = true;
            target.hitTime = currentTime;
            projectiles.splice(i, 1);
            continue;
        }

        const velocityX = (x / distance) * towerType.projectile.speed;
        const velocityY = (y / distance) * towerType.projectile.speed;

        projectile.x += velocityX;
        projectile.y += velocityY;
    }
}

export function drawProjectiles(gl, tower, texture) {
    if (projectiles.length === 0) {
        return;
    }

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
        gl.uniform4f(tower.colorLocation, 0.9, 0.75, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}
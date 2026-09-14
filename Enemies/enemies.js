import { createProgram, createShader } from '../utils.js';

const enemyPositions = [
    { x: 0.0, y: 0.0 },
    { x: 0.6, y: -0.5 },
    { x: -0.7, y: 0.2 }
];

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

const frames = 8;
const columns = 8;
const rows = 3;
const animationRow = 1;
const frameDuration = 100;

let time = 0.0;
let currentFrame = 0;

export function drawEnemies(gl, enemies, texture, currentTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(enemies.program);
    gl.bindVertexArray(enemies.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(enemies.textureLocation, 0);
    gl.uniform2f(enemies.sizeLocation, 0.20, 0.20);

    if ((currentTime - time) > frameDuration) {
        currentFrame = (currentFrame + 1) % frames;
        time = currentTime;
    }

    const frameDurationX = (currentFrame % columns) / columns;
    const frameDurationY = animationRow / rows;

    gl.uniform2f(enemies.frameScaleLocation, 1 / columns, 1 / rows);
    gl.uniform2f(enemies.frameDislocationLocation, frameDurationX, frameDurationY);

    enemyPositions.forEach((enemy) => {
        gl.uniform2f(enemies.positionLocation, enemy.x, enemy.y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}

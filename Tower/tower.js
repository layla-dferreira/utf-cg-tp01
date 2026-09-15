import { createProgram, createShader } from '../utils.js';

const towerPosition = { x: -0.4, y: 0.3, currentFrame: 0, time: 0 };

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
        positionLocation: gl.getUniformLocation(program, 'towerPosition'),
        sizeLocation: gl.getUniformLocation(program, 'towerSize'),
        frameDislocationLocation: gl.getUniformLocation(program, 'towerFrameDislocation'),
        frameScaleLocation: gl.getUniformLocation(program, 'towerFrameScale')
    };
}

const configFrames = {
    tower: { frames: 6, columns: 6, rows: 1, animationRow: 0, frameDuration: 100 }
};
export function drawTower(gl, tower, texture, currentTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(tower.program);
    gl.bindVertexArray(tower.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(tower.textureLocation, 0);
    gl.uniform2f(tower.sizeLocation, 0.23, 0.36);
    gl.uniform2f(tower.positionLocation, towerPosition.x, towerPosition.y);

    if ((currentTime - towerPosition.time) > configFrames.tower.frameDuration) {
        towerPosition.currentFrame = (towerPosition.currentFrame + 1) % configFrames.tower.frames;
        towerPosition.time = currentTime;
    }

    const frameDurationX = (towerPosition.currentFrame % configFrames.tower.columns) / configFrames.tower.columns;
    const frameDurationY = configFrames.tower.animationRow / configFrames.tower.rows;

    gl.uniform2f(tower.frameScaleLocation, 1 / configFrames.tower.columns, 1 / configFrames.tower.rows);
    gl.uniform2f(tower.frameDislocationLocation, frameDurationX, frameDurationY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}

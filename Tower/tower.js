import { createProgram, createShader } from '../utils.js';

const towerPosition = { x: -0.4, y: 0.2 };

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
        1, -1, 0.166667, 0,
        -1, 1, 0, 1,
        -1, 1, 0, 1,
        1, -1, 0.166667, 0,
        1, 1, 0.166667, 1
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
        sizeLocation: gl.getUniformLocation(program, 'towerSize')
    };
}

export function drawTower(gl, tower, texture) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(tower.program);
    gl.bindVertexArray(tower.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(tower.textureLocation, 0);
    gl.uniform2f(tower.sizeLocation, 0.12, 0.22);
    gl.uniform2f(tower.positionLocation, towerPosition.x, towerPosition.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}

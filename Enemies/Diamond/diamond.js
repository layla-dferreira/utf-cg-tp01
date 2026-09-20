import { createProgram, createShader } from '../../utils.js';

export const diamondInformations = [];

export async function setupDiamond(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./Enemies/Diamond/vertexShaderDiamond.glsl'),
        fetch('./Enemies/Diamond/fragmentShaderDiamond.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'diamond vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'diamond fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
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
        textureLocation: gl.getUniformLocation(program, 'diamondTexture'),
        colorLocation: gl.getUniformLocation(program, 'color'),
        positionLocation: gl.getUniformLocation(program, 'diamondPosition'),
        sizeLocation: gl.getUniformLocation(program, 'diamondSize')
    };
}

export const diamondCollision = { width: 0.1, height: 0.1, offsetY: 0 };

export function drawDiamonds(gl, diamondProgram, texture, diamondInformations) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(diamondProgram.program);
    gl.bindVertexArray(diamondProgram.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(diamondProgram.textureLocation, 0);
    gl.uniform4f(diamondProgram.colorLocation, 0.8, 0.8, 0.8, 1);

    for (const diamond of diamondInformations) {
        gl.uniform2f(diamondProgram.positionLocation, diamond.x, diamond.y);
        gl.uniform2f(diamondProgram.sizeLocation, diamond.width, diamond.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}
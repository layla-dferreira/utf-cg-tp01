import { createProgram, createShader } from '../../utils.js';

export async function setupBar(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./Tower/bar/vertexShaderBar.glsl'),
        fetch('./Tower/bar/fragmentShaderBar.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'bar vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'bar fragment shader   ', gl.FRAGMENT_SHADER, fragmentShaderCode)
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
        positionLocation: gl.getUniformLocation(program, 'barPosition'),
        sizeLocation: gl.getUniformLocation(program, 'barSize'),
        healthLocation: gl.getUniformLocation(program, 'barHealth'),
    };
}

export function drawBar(gl, bar, x, y, currentHealth, maxHealth) {
    if (currentHealth <= 0)
        return;

    gl.useProgram(bar.program);
    gl.bindVertexArray(bar.vao);

    const percentage = Math.max(0.0, currentHealth / maxHealth);

    gl.uniform1f(bar.healthLocation, percentage);
    gl.uniform2f(bar.positionLocation, x, y);
    gl.uniform2f(bar.sizeLocation, 0.15, 0.02);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
}


import { createProgram, createShader } from '../utils.js';

const playerPosition = { x: 0.4, y: 0.1, currentFrame: 0, time: 0 };

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
    player: { frames: 12, columns: 12, rows: 1, animationRow: 0, frameDuration: 100 }
};

export function drawPlayer(gl, player, texture, currentTime) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(player.program);
    gl.bindVertexArray(player.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(player.textureLocation, 0);
    gl.uniform2f(player.sizeLocation, 0.14, 0.14);
    gl.uniform2f(player.positionLocation, playerPosition.x, playerPosition.y);

    if ((currentTime - playerPosition.time) > configFrames.player.frameDuration) {
        playerPosition.currentFrame = (playerPosition.currentFrame + 1) % configFrames.player.frames;
        playerPosition.time = currentTime;
    }

    const frameDurationX = (playerPosition.currentFrame % configFrames.player.columns) / configFrames.player.columns;
    const frameDurationY = configFrames.player.animationRow / configFrames.player.rows;

    gl.uniform2f(player.frameScaleLocation, 1 / configFrames.player.columns, 1 / configFrames.player.rows);
    gl.uniform2f(player.frameDislocationLocation, frameDurationX, frameDurationY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
}

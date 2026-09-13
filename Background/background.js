import { createProgram, createShader } from '../utils.js';

export async function setupBackground(gl) {
  const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
    fetch('./Background/vertexShaderBackground.glsl'),
    fetch('./Background/fragmentShaderBackground.glsl')
  ]);

  const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
    vertexShaderResponse.text(),
    fragmentShaderResponse.text()
  ]);

  const program = createProgram(
    gl,
    createShader(gl, 'background vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
    createShader(gl, 'background fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
  );

  const positionAttributeLocation = gl.getAttribLocation(program, 'position');
  const texturePositionAttributeLocation = gl.getAttribLocation(program, 'texturePosition');
  const textureLocation = gl.getUniformLocation(program, 'backgroundTexture');

  const vertices = new Float32Array([
    -1, -1, 0, 0,
    1, -1, 1, 0,
    -1, 1, 0, 1,
    -1, 1, 0, 1,
    1, -1, 1, 0,
    1, 1, 1, 1
  ]);

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(texturePositionAttributeLocation);
  gl.vertexAttribPointer(texturePositionAttributeLocation, 2, gl.FLOAT, false, 16, 8);
  gl.bindVertexArray(null);

  return { program, vao, textureLocation };
}

export function drawBackground(gl, background, texture) {
  gl.useProgram(background.program);
  gl.bindVertexArray(background.vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(background.textureLocation, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}

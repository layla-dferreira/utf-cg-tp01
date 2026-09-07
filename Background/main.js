import { createProgram, createShader, createTexture } from './utils.js';

function ortho(left, right, bottom, top, near, far) {
  const tx = -(right + left) / (right - left)
  const ty = -(top + bottom) / (top - bottom)
  const tz = -(far + near) / (far - near)

  return new Float32Array([
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, -2 / (far - near), 0,
    tx, ty, tz, 1
  ])
}

export function setupWebGL() {
  const canvas = document.querySelector('.canvas-tower-defense');
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    console.error('WebGL não esta disponivel.');
    throw new Error('WebGL não suportado.');
  }
  return gl;
}

export function initialize(gl) {
  const vertexShaderCode = document.querySelector('[type="shader/vertex"]').textContent;
  const fragmentShaderCode = document.querySelector('[type="shader/fragment"]').textContent;

  const program = createProgram(gl, createShader(gl, 'vs', gl.VERTEX_SHADER, vertexShaderCode),
    createShader(gl, 'fs', gl.FRAGMENT_SHADER, fragmentShaderCode)
  );
  gl.useProgram(program);
  gl.program = program;

  const positionAttributeLocation = gl.getAttribLocation(program, 'position');
  const texturePositionAttributeLocation = gl.getAttribLocation(program, 'texturePosition');
  const textureLocation = gl.getUniformLocation(program, 'backgroundTexture');

  const vertices = new Float32Array([
    -1, -1, 0, 0,
    1, -1, 1, 0,
    -1, 1, 0, 1,
    -1, 1, 0, 1,
    1, -1, 1, 0,
    1, 1, 1, 1,
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

  gl.programInfo = { vao, textureLocation };
  gl.bindVertexArray(null);
}

export function render(gl, texture) {
  const { vao, textureLocation } = gl.programInfo;

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(gl.program);
  gl.bindVertexArray(vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(textureLocation, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}

export function loadBackground(gl, path) {
  const image = new Image();
  image.src = path;
  image.onload = () => render(gl, createTexture(gl, image));
  image.onerror = () => console.error(`Não foi possível carregar a imagem: ${path}`);
}
import { createProgram, createShader, createTexture } from './utils.js';
import { getEnemies } from '../Enemies/main.js';

/* function ortho(left, right, bottom, top, near, far) {
  const tx = -(right + left) / (right - left)
  const ty = -(top + bottom) / (top - bottom)
  const tz = -(far + near) / (far - near)

  return new Float32Array([
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, -2 / (far - near), 0,
    tx, ty, tz, 1
  ])
} */

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

  const enemyVertexShaderCode = document.querySelector('#enemy-vertex-shader').textContent;
  const enemyFragmentShaderCode = document.querySelector('#enemy-fragment-shader').textContent;
  const enemyProgram = createProgram(
    gl,
    createShader(gl, 'enemy vertex shader', gl.VERTEX_SHADER, enemyVertexShaderCode),
    createShader(gl, 'enemy fragment shader', gl.FRAGMENT_SHADER, enemyFragmentShaderCode)
  );

  const enemyVao = gl.createVertexArray();
  const enemyBuffer = gl.createBuffer();
  const enemyPositionLocation = gl.getAttribLocation(enemyProgram, 'position');
  const enemyTexturePositionLocation = gl.getAttribLocation(enemyProgram, 'texturePosition');

  const enemyVertices = new Float32Array([
    -1, -1, 0, 0,
    1, -1, 0.125, 0,
    -1, 1, 0, 0.333,
    -1, 1, 0, 0.333,
    1, -1, 0.125, 0,
    1, 1, 0.125, 0.333
  ]);

  gl.bindVertexArray(enemyVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, enemyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, enemyVertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(enemyPositionLocation);
  gl.vertexAttribPointer(enemyPositionLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(enemyTexturePositionLocation);
  gl.vertexAttribPointer(enemyTexturePositionLocation, 2, gl.FLOAT, false, 16, 8);
  gl.bindVertexArray(null);

  gl.enemyProgramInfo = {
    program: enemyProgram,
    vao: enemyVao,
    textureLocation: gl.getUniformLocation(enemyProgram, 'enemyTexture'),
    positionLocation: gl.getUniformLocation(enemyProgram, 'enemyPosition'),
    sizeLocation: gl.getUniformLocation(enemyProgram, 'enemySize')
  };
}

export function render(gl, backgroundTexture, enemyTexture) {
  const { vao, textureLocation } = gl.programInfo;

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(gl.program);
  gl.bindVertexArray(vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.uniform1i(textureLocation, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);

  drawEnemies(gl, enemyTexture);
}

function drawEnemies(gl, enemyTexture) {
  const { program, vao, textureLocation, positionLocation, sizeLocation } = gl.enemyProgramInfo;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, enemyTexture);
  gl.uniform1i(textureLocation, 0);
  gl.uniform2f(sizeLocation, 0.20, 0.20);

  getEnemies().forEach((enemy) => {
    gl.uniform2f(positionLocation, enemy.x, enemy.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });

  gl.bindVertexArray(null);
  gl.disable(gl.BLEND);
}

export async function loadImages(gl, backgroundPath, enemyPath) {
  try {
    const loadImage = (path) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(createTexture(gl, img));
      img.onerror = () => reject(new Error(`Erro ao carregar: ${path}`));
      img.src = path;
    });

    const [backgroundTexture, enemyTexture] = await Promise.all([
      loadImage(backgroundPath),
      loadImage(enemyPath)
    ]);

    render(gl, backgroundTexture, enemyTexture);
  } catch (error) {
    console.error(error);
  }
}
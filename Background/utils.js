export const createShader = (gl, name, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source.trim());
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const infoLog = gl.getShaderInfoLog(shader);
  console.error(`Erro ao compilar o shader ${name}:`, infoLog);
  gl.deleteShader(shader);
  throw new Error(`Falha na compilação do shader ${name}: ` + infoLog);
};


export const createProgram = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  const infoLog = gl.getProgramInfoLog(program);
  console.error('Erro ao linkar o programa:', infoLog);
  gl.deleteProgram(program);
  throw new Error('Falha na linkedição do programa: ' + infoLog);
};

export const createProgramFromFiles = async (gl, vertexPath, fragmentPath) => {
  const [vsSource, fsSource] = await Promise.all([
    fetch(vertexPath).then(res => res.text()),
    fetch(fragmentPath).then(res => res.text())
  ]);

  const vertexShader = createShader(gl, 'vs', gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, 'fs', gl.FRAGMENT_SHADER, fsSource);

  return createProgram(gl, vertexShader, fragmentShader);
};

export function createTexture(gl, image) {
  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}
#version 300 es

in vec2 position;
in vec2 texturePosition;
out vec2 textureCoordinate;

uniform vec2 playerPosition;
uniform vec2 playerSize;

void main() {
    gl_Position = vec4(position * playerSize + playerPosition, 0.0, 1.0);
    textureCoordinate = texturePosition;
}

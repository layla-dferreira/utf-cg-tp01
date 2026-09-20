#version 300 es

uniform vec2 diamondPosition;
uniform vec2 diamondSize;

in vec2 position;
in vec2 texturePosition;
out vec2 textureCoordinate;

void main() {
    gl_Position = vec4((position * diamondSize) + diamondPosition, 0.0, 1.0);
    textureCoordinate = texturePosition;

}
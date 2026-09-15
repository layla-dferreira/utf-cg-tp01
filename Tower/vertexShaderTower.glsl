#version 300 es

in vec2 position;
in vec2 texturePosition;
out vec2 textureCoordinate;

uniform vec2 towerPosition;
uniform vec2 towerSize;
uniform vec2 towerFrameDislocation;
uniform vec2 towerFrameScale;

void main() {
    gl_Position = vec4((position * towerSize) + towerPosition, 0.0, 1.0);
    textureCoordinate = (texturePosition * towerFrameScale) + towerFrameDislocation;
}

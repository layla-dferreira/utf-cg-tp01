#version 300 es

in vec2 position;
in vec2 texturePosition;
out vec2 textureCoordinate;

uniform vec2 enemyPosition;
uniform vec2 enemySize;
uniform vec2 enemyFrameDislocation;
uniform vec2 enemyFrameScale;

void main()
{
    gl_Position = vec4((position * enemySize) + enemyPosition, 0.0, 1.0);
    textureCoordinate = (texturePosition * enemyFrameScale) + enemyFrameDislocation;
}

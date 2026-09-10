#version 300 es

in vec2 position;
in vec2 texturePosition;
out vec2 textureCoordinate;

uniform vec2 enemyPosition;
uniform vec2 enemySize;

void main()
{
    gl_Position = vec4(position * enemySize + enemyPosition, 0.0, 1.0);
    textureCoordinate = texturePosition;
}

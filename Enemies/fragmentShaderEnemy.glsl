#version 300 es

precision highp float;
uniform sampler2D enemyTexture;

in vec2 textureCoordinate;
out vec4 outColor;

void main()
{
    outColor = texture(enemyTexture, textureCoordinate);
}

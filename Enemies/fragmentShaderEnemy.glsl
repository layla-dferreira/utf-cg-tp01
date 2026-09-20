#version 300 es

precision highp float;
uniform sampler2D enemyTexture;
uniform vec4 color;

in vec2 textureCoordinate;
out vec4 outColor;

void main() {
    vec4 textureColor = texture(enemyTexture, textureCoordinate);
    outColor = textureColor * color;
}

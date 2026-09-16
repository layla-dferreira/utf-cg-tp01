#version 300 es

precision highp float;
uniform sampler2D towerTexture;
uniform vec4 towerColor;

in vec2 textureCoordinate;
out vec4 outColor;

void main() {
    vec4 textureColor = texture(towerTexture, textureCoordinate);
    outColor = textureColor * towerColor;
}

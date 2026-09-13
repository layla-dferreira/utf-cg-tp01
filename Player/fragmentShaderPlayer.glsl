#version 300 es

precision highp float;
uniform sampler2D playerTexture;

in vec2 textureCoordinate;
out vec4 outColor;

void main() {
    outColor = texture(playerTexture, textureCoordinate);
}

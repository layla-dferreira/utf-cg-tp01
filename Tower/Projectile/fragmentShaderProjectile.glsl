#version 300 es

precision mediump float;

in vec2 textureCoordinate;
out vec4 outColor;

uniform sampler2D projectileTexture;
uniform vec4 projectileColor;

void main() {
    vec4 textureColor = texture(projectileTexture, textureCoordinate);
    outColor = textureColor * projectileColor;
}
#version 300 es

precision mediump float;
uniform sampler2D diamondTexture;
uniform vec4 color;

in vec2 textureCoordinate;
out vec4 outColor;

void main() {
    vec4 textureColor = texture(diamondTexture, textureCoordinate);
    outColor = textureColor * color;
}
#version 300 es

precision highp float;

uniform float barHealth;

in vec2 uPosition;
out vec4 outColor;

void main()
{
    if (uPosition.x < barHealth) {
        outColor = vec4(0.6, 1.0, 0.85, 1.0);
    } else {
        outColor = vec4(1.0, 0.6, 0.6, 1.0);
    }
}
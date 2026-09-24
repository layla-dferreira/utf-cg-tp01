#version 300 es

precision mediump float;

in vec2 localPosition;
out vec4 outColor;

void main() {
    float distanceFromCenter = length(localPosition);

    if (distanceFromCenter > 1.0) {
        discard;
    }

    vec4 colorCenter = vec4(0.4, 0.2, 0.7, 0.15);
    vec4 colorBorder = vec4(0.7, 0.0, 1.0, 0.5);
    
    outColor = mix(colorCenter, colorBorder, distanceFromCenter);
}
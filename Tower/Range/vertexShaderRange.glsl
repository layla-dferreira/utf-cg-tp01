#version 300 es

in vec2 position;
out vec2 localPosition;

uniform vec2 rangePosition;
uniform vec2 rangeSize;

void main() {
    localPosition = position;
    vec2 scaledPosition = position * rangeSize + rangePosition;
    gl_Position = vec4(scaledPosition, 0.0, 1.0);
}
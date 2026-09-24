#version 300 es

uniform vec2 barPosition;
uniform vec2 barSize;

in vec2 position;
out vec2 uPosition;

void main() {
    gl_Position = vec4((position * barSize) + barPosition, 0.0, 1.0);
    uPosition = (position * 0.5) + 0.5;
}
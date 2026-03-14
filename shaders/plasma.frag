#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

void main() {
    vec2 uv = FlutterFragCoord().xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    float t = iTime * 0.5;

    // A simple plasma effect
    float v1 = sin(uv.x * 10.0 + t);
    float v2 = sin(10.0 * (uv.x * sin(t / 2.0) + uv.y * cos(t / 3.0)) + t);
    float cx = uv.x + 0.5 * sin(t / 5.0);
    float cy = uv.y + 0.5 * cos(t / 3.0);
    float v3 = sin(sqrt(100.0 * (cx * cx + cy * cy) + 1.0) + t);

    float vf = v1 + v2 + v3;

    float r = cos(vf * 3.14159);
    float g = sin(vf * 3.14159 + 3.0 * 3.14159 / 3.0);
    float b = cos(vf * 3.14159 + 2.0 * 3.14159 / 3.0);
    
    vec3 color = vec3(r, g, b) * 0.5 + 0.5;

    fragColor = vec4(color, 1.0);
}

#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform float r1;
uniform float g1;
uniform float b1;

uniform float r2;
uniform float g2;
uniform float b2;

uniform float r3;
uniform float g3;
uniform float b3;

uniform float r4;
uniform float g4;
uniform float b4;


out vec4 fragColor;

void main() {
    vec2 uv = FlutterFragCoord().xy / iResolution.xy;

    vec3 c1 = vec3(r1, g1, b1);
    vec3 c2 = vec3(r2, g2, b2);
    vec3 c3 = vec3(r3, g3, b3);
    vec3 c4 = vec3(r4, g4, b4);
    
    // Animated coordinates for the 4 color points
    float t = iTime * 0.4;
    
    vec2 p1 = vec2(sin(t * 1.3), cos(t * 1.7)) * 0.4 + 0.5;
    vec2 p2 = vec2(cos(t * 1.5), sin(t * 1.4)) * 0.4 + 0.5;
    vec2 p3 = vec2(sin(t * 1.1 + 3.14), cos(t * 1.2 + 3.14)) * 0.4 + 0.5;
    vec2 p4 = vec2(cos(t * 1.6 + 3.14), sin(t * 1.8 + 3.14)) * 0.4 + 0.5;

    // Distances from current pixel to each of the 4 points
    float d1 = length(uv - p1);
    float d2 = length(uv - p2);
    float d3 = length(uv - p3);
    float d4 = length(uv - p4);

    // Weights (inverse square distance)
    float w1 = 1.0 / (d1 * d1 + 0.05);
    float w2 = 1.0 / (d2 * d2 + 0.05);
    float w3 = 1.0 / (d3 * d3 + 0.05);
    float w4 = 1.0 / (d4 * d4 + 0.05);
    
    float sum = w1 + w2 + w3 + w4;

    // Mix colors based on weights
    vec3 color = (c1 * w1 + c2 * w2 + c3 * w3 + c4 * w4) / sum;
    
    // Add interactivity
    float mouseDist = length(FlutterFragCoord().xy - iMouse.xy);
    float mouseGlow = max(0.0, 1.0 - (mouseDist / 400.0));
    color += vec3(0.05) * mouseGlow;

    fragColor = vec4(color, 1.0);
}

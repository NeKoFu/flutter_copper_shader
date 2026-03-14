#version 460 core
#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    vec2 uv = fragCoord / iResolution.y;
    
    // Ocean colors
    vec3 waterColor = vec3(0.0, 0.3, 0.7);
    vec3 deepColor = vec3(0.0, 0.1, 0.3);
    
    // Key trick: push coordinates away from absolute [0, 0] to avoid NaN (division by zero)
    // while preserving the original fluid mathematical formula
    vec2 p = uv * 6.0 - vec2(250.0, 250.0); 
    
    // Original caustic math formula
    float time = iTime * 0.5;
    vec2 i = vec2(p);
    float c = 1.0;
    float inten = 0.005;
    
    for (int n = 0; n < 5; n++) {
        float t = time * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
    }
    
    // Contrast and exposure boosted to make the effect stand out
    c /= 5.0;
    c = 1.17 - pow(c, 1.4);
    float glow = pow(abs(c), 8.0) * 1.5; // boost multiplier for a stronger highlight
    
    // Darken the image toward the edges
    float vignette = length(uv - vec2(0.5 * iResolution.x/iResolution.y, 0.5));
    vec3 col = mix(waterColor, deepColor, smoothstep(0.0, 1.2, vignette));
    
    // Apply the caustic highlights
    col += vec3(0.8, 0.9, 1.0) * glow;

    fragColor = vec4(col, 1.0);
}

#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float isAndroid;

out vec4 fragColor;

// Palettes for the gradient
vec3 colorTop = vec3(0.18, 0.72, 0.73);     // Cyan/Teal
vec3 colorMiddle = vec3(0.92, 0.94, 0.84);  // Cream/Light yellow
vec3 colorBottom = vec3(0.95, 0.5, 0.15);   // Orange

vec3 hueRotate(vec3 color, float angle) {
    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(angle);
    return color * cosAngle + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - cosAngle);
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    if (isAndroid > 0.5) {
        fragCoord.y = iResolution.y - fragCoord.y;
    }
    
    // Normalize coordinates
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    
    // Keep aspect ratio for spatial coordinates
    p.x *= iResolution.x / iResolution.y;

    float t = iTime * 0.12;
    
    // Accumulate domain perturbation for the gradient shift 
    // and collect sharp edge highlights
    float perturb = 0.0;
    float edgeHighlights = 0.0;
    
    for (int i = 0; i < 12; i++) {
        float fi = float(i + 1);
        
        // Gentle wave functions
        float wave = sin(p.y * 1.5 + t + fi) * 0.25;
        wave += cos(p.y * 0.8 - t * 0.6 + fi * 2.0) * 0.15;
        
        // Diagonal curve baseline extending from bottom-left to top-right visually
        float curveX = p.x - wave + (p.y * 0.5) - fi * 0.65 + 1.2;
        
        // Shift the underlying gradient coordinate based on side of fold
        // This naturally creates the illusion of overlapping transparent, colored paper
        float layerShift = smoothstep(-0.05, 0.2, curveX) * 0.08;
        perturb += layerShift;
        
        // Sharp edge highlights exactly on the boundary to mimic glass or a specular fold
        float edge = exp(-abs(curveX) * 90.0);
        edgeHighlights += edge * 0.16;
    }
    
    // Base gradient direction: diagonal from bottom-left to top-right
    float diag = uv.y * 0.5 + uv.x * 0.5;
    
    // Apply the spatial distortion to the gradient
    diag -= perturb;
    
    // Multi-stop background gradient fetch
    vec3 col;
    if (diag > 0.55) {
        col = mix(colorMiddle, colorTop, smoothstep(0.55, 1.0, diag));
    } else {
        col = mix(colorBottom, colorMiddle, smoothstep(0.0, 0.55, diag));
    }
    
    // Add specular white highlights along the curves
    col += vec3(1.0) * edgeHighlights;

    // Slowly rotate colors (hue) over time
    col = hueRotate(col, iTime * 0.2);

    // Subtle vignette
    float vignette = length(uv - 0.5);
    col -= vignette * 0.15;

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}

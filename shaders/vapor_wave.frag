#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float isAndroid;

out vec4 fragColor;

// Rotate the color vector around the grayscale axis (1/sqrt(3))
vec3 hueShift(vec3 color, float angle) {
    const vec3 k = vec3(0.577350269); 
    float c = cos(angle);
    return color * c + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - c);
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    if (isAndroid > 0.5) {
        fragCoord.y = iResolution.y - fragCoord.y;
    }
    
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;
    
    vec3 bgCol = vec3(0.98, 0.99, 1.0);
    vec3 col = bgCol;
    
    vec3 colorA = vec3(0.05, 0.6, 0.7); 
    vec3 colorB = vec3(0.2, 0.4, 0.8);  
        
    float threads = 0.1;
    
    for(int i = 0; i < 48; i++) {
        float fi = float(i);
        
        float t = iTime * 0.15 + fi * 0.02; 
        
        float wave1 = sin(p.y * 1.8 + t) * 0.25;
        float wave2 = cos(p.y * 1.2 - t * 0.8) * 0.15;
        float wave3 = sin(p.y * 3.0 + t * 1.5) * 0.05;
        
        float curve = wave1 + wave2 + wave3 + sin(fi * 2.0) * 0.02; 
        
        float d = p.x - curve * (1.6 - abs(p.y) * 0.2); 
            
        float density = 0.0;
        if (d > 0.0) {
            density = exp(-d * 16.0); 
            density *= threads;
        } else {
            density = exp(d * 40.0); 
        }
        
        float mixFactor = sin(fi * 0.15 + iTime * 0.1) * 0.5 + 0.5;
        vec3 ribbonCol = mix(colorA, colorB, mixFactor);
        
        // 0.1 multiplier used to control the rotation speed
        ribbonCol = hueShift(ribbonCol, iTime * 0.1 + fi * 0.01);
        
        float alpha = density * 0.05; 
        
        float edgeShadow = smoothstep(0.005, -0.001, d);
        ribbonCol *= mix(1.0, 0.78, edgeShadow);
        
        col = mix(col, ribbonCol, alpha);
    }
    
    float vignette = length(uv - 0.5);
    col = mix(col, vec3(0.85, 0.9, 0.95), vignette * 0.2);
    
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}

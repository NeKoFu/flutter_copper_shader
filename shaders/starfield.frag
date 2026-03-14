#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

// Simple starfield based on https://www.shadertoy.com/view/Md2SR3
void main() {
    vec2 uv = FlutterFragCoord().xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    vec3 color = vec3(0.0);
    
    // Rotate 
    float s = sin(iTime * 0.1);
    float c = cos(iTime * 0.1);
    mat2 rot = mat2(c, -s, s, c);
    uv *= rot;

    for (float i = 0.0; i < 16.0; i++) {
        float f = 1.0 - fract(iTime * 0.2 + i * 0.1);
        vec2 p = uv * (1.0 + f * 5.0) + vec2(sin(i * 13.0) * 2.0, cos(i * 17.0) * 2.0);
        
        // Fade at both ends (near 0 and near 1) to hide appearance/disappearance
        float fade = smoothstep(0.0, 0.1, f) * (1.0 - smoothstep(0.9, 1.0, f));
        
        float intensity = 0.005 / length(mod(p, 1.0) - 0.5);
        color += vec3(intensity * f * fade);
    }
    
    // Add interaction
    float mouseDist = length(FlutterFragCoord().xy - iMouse.xy);
    float mouseGlow = max(0.0, 1.0 - (mouseDist / 200.0));
    color += vec3(0.1, 0.4, 0.8) * mouseGlow;

    fragColor = vec4(color, 1.0);
}

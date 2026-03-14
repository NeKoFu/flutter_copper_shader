#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform float primaryR;
uniform float primaryG;
uniform float primaryB;

out vec4 fragColor;

// Vapor: An ethereal volumetric effect inspired by volumetric raymarching.
// Designed specifically for flutter_copper_shader.

mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

// A new custom distance field for a Vaporwave-like twisting cloud
float map(vec3 p) {
    // Tumble space
    p.xz *= rot(iTime * 0.25);
    p.xy *= rot(iTime * 0.15);
    
    // Wave ripple distortion
    vec3 q = p * 2.5 + iTime * 1.5;
    float distortion = sin(q.x) * cos(q.y) * sin(q.z);
    
    // Combining a soft sphere with the distortion
    return length(p) - 1.0 + distortion * 0.6;
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    
    // Center coordinates
    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    vec3 cl = vec3(0.0);
    float d = 2.0;
    
    // Volumetric raymarching loop
    for(int i = 0; i <= 6; i++) {
        vec3 pos = vec3(0.0, 0.0, 5.0) + normalize(vec3(p, -1.0)) * d;
        float rz = map(pos);
        
        // Pseudo-directional lighting approximation using finite difference
        float f = clamp((rz - map(pos + 0.1)) * 0.5, -0.1, 1.0);
        
        // Vaporwave color palette: deep cyan ambient + custom primary color highlight
        vec3 primary = vec3(primaryR, primaryG, primaryB);
        vec3 l = vec3(0.05, 0.15, 0.3) + primary * f;
        
        // Accumulate glow and light
        cl = cl * l + smoothstep(2.5, 0.0, rz) * 0.8 * l;
        
        d += min(rz, 1.0);
    }
    
    // Subtle interactive mouse glow
    float mouseDist = length(fragCoord - iMouse.xy) / iResolution.y;
    cl += vec3(0.4, 0.0, 0.8) * smoothstep(0.4, 0.0, mouseDist) * 0.3;
    
    fragColor = vec4(cl, 1.0);
}

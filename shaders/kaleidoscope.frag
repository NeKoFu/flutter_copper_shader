#version 460 core
#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

// Cosine palette for the neon aura
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.3, 0.2, 0.5);
    return a + b * cos(6.28318 * (c * t + d));
}

// Distance function to a perfect polygon (a hexagon here)
float sdPolygon(vec2 p, float n) {
    // Intrinsic polygon rotation
    float a = atan(p.x, p.y) + iTime * 0.15;
    float b = 6.28318 / n;
    return cos(floor(0.5 + a/b) * b - a) * length(p);
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    // Broad, majestic rotation of space
    float angle = iTime * 0.1;
    float s = sin(angle), c = cos(angle);
    uv = mat2(c, -s, s, c) * uv;
    
    // Fractal repetition (kaleidoscopic iterated function system)
    for (float i = 0.0; i < 4.0; i++) {
        // Spatial folding / repetition
        uv = fract(uv * 1.5) - 0.5;
        
        // Edge calculation for a 6-sided polygon (nested hexagons)
        float numSides = 6.0; 
        float d = sdPolygon(uv, numSides) * exp(-length(uv0));
        
        // Color evolving with radius and time
        vec3 col = palette(length(uv0) + i * 0.4 + iTime * 0.4);
        
        // Luminous echo around the polygon edge (kinetic waves)
        d = sin(d * 10.0 + iTime * 2.0) / 10.0;
        d = abs(d);
        
        // Glowing wireframe
        d = pow(0.01 / d, 1.5);
        
        finalColor += col * d;
    }
    
    // Very subtle vignette for the interstellar void
    finalColor *= 1.0 - 0.2 * length(uv0);
    
    fragColor = vec4(finalColor, 1.0);
}

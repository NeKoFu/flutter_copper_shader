#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

// Hash function used to generate random properties per cell
vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// Cosine palette used to generate pastel colors by increasing base brightness and lowering contrast
vec3 palette(float t) {
    vec3 a = vec3(0.8, 0.8, 0.8);
    vec3 b = vec3(0.2, 0.2, 0.2);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.00, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    
    // Corrected screen ratio
    vec2 uv = fragCoord / iResolution.y;
    
    // Scale (number of visible Voronoi cells) increased to reduce cell size
    uv *= 14.0;
    
    // Grid coordinates and local coordinates
    vec2 p = floor(uv);
    vec2 f = fract(uv);
    
    // Pass 1: find the nearest seed point
    float minDist = 100.0;
    vec2 closestPoint;
    vec2 cellId;
    
    for(int j = -2; j <= 2; j++) {
        for(int i = -2; i <= 2; i++) {
            vec2 b = vec2(float(i), float(j));
            
            // Random point position inside the vec2(i, j) cell
            vec2 r = b - f + hash2(p + b);
            
            // Animation: each point rotates/oscillates using its unique hash, slowed down heavily
            float speed = 0.3; // Ancien speed = 1.0
            r += 0.45 * sin(iTime * speed + 6.2831 * hash2(p + b));
            
            float d = dot(r, r); // Squared distance
            
            if(d < minDist) {
                minDist = d;
                closestPoint = r;
                cellId = p + b;
            }
        }
    }
    
    // Pass 2: calculate the actual distance to the edges
    float minEdgeDist = 100.0;
    
    for(int j = -2; j <= 2; j++) {
        for(int i = -2; i <= 2; i++) {
            vec2 b = vec2(float(i), float(j));
            vec2 r = b - f + hash2(p + b);
            
            r += 0.45 * sin(iTime * 0.3 + 6.2831 * hash2(p + b));
            
            // Ignore the parent point when comparing it against itself
            if(dot(closestPoint - r, closestPoint - r) > 0.00001) {
                // Mathematical projection used to find the Voronoi edge
                float edgeDist = dot(0.5 * (closestPoint + r), normalize(r - closestPoint));
                minEdgeDist = min(minEdgeDist, edgeDist);
            }
        }
    }
    
    // --- PASTEL LOOK AND COLOR TREATMENT ---
    
    // Unique identifier for the cell color
    float randomId = hash2(cellId).x;
    
    // Base cell color drifting over time (slowed to 0.05 instead of 0.15)
    vec3 cellColor = palette(randomId + iTime * 0.05);
    vec3 col = cellColor;
    
    // Luminous halo / clean geometric lines to outline the crystals (white edges)
    // Draw true straight white borders, much less blurry (0.02 instead of 0.06)
    float edgeIntensity = smoothstep(0.04, 0.0, minEdgeDist);
    col = mix(col, vec3(1.0), edgeIntensity);
    
    // (The center glow points and mouse interactivity were removed)
    
    // Slight vignette to darken the screen corners
    vec2 screenUv = fragCoord / iResolution.xy;
    col *= 1.0 - 0.4 * length(screenUv - 0.5);

    fragColor = vec4(col, 1.0);
}

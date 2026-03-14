#version 460 core
#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    vec3 col = vec3(0.02, 0.0, 0.05); // Dark background for quantum space
    
    // Multiple layers to simulate depth of field (parallax)
    for(float i = 0.0; i < 5.0; i++) {
        // Rescale the layer to stagger depth from far to near
        float scale = 4.0 + i * 2.0;
        vec2 layerUv = uv * scale;
        
        // Spatial drift to create the impression of flowing information/particles
        layerUv.y -= iTime * 0.2 * (i + 1.0);
        layerUv.x += sin(iTime * 0.1 + i) * (i + 1.0) * 0.5;
        
        // Divide space into cells
        vec2 gv = fract(layerUv) - 0.5;
        vec2 id = floor(layerUv);
        
        // Random variables for this particle cell (autonomous behavior)
        float h = hash(id + i);
        
        // Complex orbital motion for the atom
        float angle = iTime * (h * 2.0 + 1.0) + h * 6.2831;
        float radius = h * 0.4;
        vec2 p = vec2(cos(angle), sin(angle)) * radius;
        
        float d = length(gv - p);
        
        // Quantum flicker / pulsing
        float blink = 0.5 + 0.5 * sin(iTime * 2.0 + h * 100.0);
        
        // Particle light radius ("glow")
        float glow = 0.01 / d;
        glow *= smoothstep(0.4, 0.1, d); // Limit the glow spread
        
        // Dynamic atom color (fluorescent blue and violet hues)
        vec3 particleCol = 0.5 + 0.5 * cos(iTime * 0.2 + h * 6.28 + vec3(0.0, 2.0, 4.0));
        
        // Apply while preserving atmospheric attenuation on distant layers (1.0 - i * 0.15)
        col += particleCol * glow * blink * (1.0 - i * 0.15);
    }
    
    // Global exposure correction
    col = pow(col, vec3(0.8));
    
    fragColor = vec4(col, 1.0);
}

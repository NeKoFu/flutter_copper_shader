#version 460 core
#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float isAndroid;

out vec4 fragColor;

// Noise used for the stars
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    if (isAndroid > 0.5) {
        fragCoord.y = iResolution.y - fragCoord.y;
    }
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    // Center of the screen used as the horizon
    float horizon = -0.15; 
    
    vec3 col = vec3(0.0);
    
    if (uv.y > horizon) {
        // Sky matching the reference image style (dark magenta at the top, pink/violet in the middle, cyan at the horizon)
        float dy = uv.y - horizon;
        vec3 skyColor = mix(vec3(0.0, 0.8, 0.9), vec3(0.9, 0.0, 0.6), smoothstep(0.0, 0.3, dy));
        skyColor = mix(skyColor, vec3(0.3, 0.0, 0.4), smoothstep(0.2, 0.6, dy));
        
        // --- STARS SCATTERED IN THE BACKGROUND ---
        float starVal = hash(floor(uv * 150.0));
        // Only a few stars twinkle
        if (starVal > 0.99) {
            float blink = 0.5 + 0.5 * sin(iTime * 5.0 + starVal * 100.0);
            skyColor += vec3(1.0) * blink * smoothstep(0.1, 0.3, dy); // Stars only appear high in the sky
        }
        
        // --- GIANT MIAMI SUN ---
        vec2 sunUv = uv - vec2(0.0, 0.15); // Lower sun center
        float sunDist = length(sunUv);
        
        if (sunDist < 0.28) {
            // Large visible disc with an inner gradient (bright yellow at the top, magenta at the bottom)
            vec3 sunBaseCol = mix(vec3(1.0, 0.8, 0.1), vec3(1.0, 0.1, 0.4), clamp((sunUv.y + 0.28) / 0.56, 0.0, 1.0));
            
            // Static cutout mask matching the classic retro image
            float mask = 1.0;
            if (sunUv.y < -0.0) {
                // Static geometric stripes: the scene moves toward the sun, but the sun stays fixed
                float stripes = fract(-sunUv.y * 30.0);
                
                // The empty stripe width grows lower down as sunUv.y becomes more negative
                float holeWidth = clamp(-sunUv.y * 2.5, 0.0, 1.0);
                
                // Clean cutout
                mask = smoothstep(holeWidth - 0.01, holeWidth + 0.01, stripes);
            }
            
            // Antialiasing for the sun edges
            float edgeDist = smoothstep(0.28, 0.275, sunDist);
            
            // Hard overlay: the pattern is sharply cut and reveals the sky behind it
            skyColor = mix(skyColor, sunBaseCol, edgeDist * mask);
            
            // Add the sun glow onto the sky
            skyColor += vec3(1.0, 0.2, 0.5) * exp(-sunDist * 8.0) * 0.4;
        }
        
        // Bright white/cyan halo right on the horizon line
        skyColor += vec3(0.6, 1.0, 1.0) * exp(-dy * 60.0);
        
        col = skyColor;
        
    } else {
        // --- GROUND PLANE (ANIMATED PERSPECTIVE GRID) ---
        vec2 p = uv;
        p.y = horizon - p.y; // Inverted distance from the horizon
        
        // 2D -> 3D projection for perspective
        vec2 proj = vec2(p.x / p.y, 1.0 / p.y);
        
        // Move toward the sun
        proj.y -= iTime * 2.5; 
        
        // Textured grid
        vec2 grid = fract(proj);
        grid = abs(grid - 0.5);
        
        // Anti-aliasing and constant thickness in perspective
        vec2 width = vec2(0.03) * p.y; 
        vec2 lines = smoothstep(width + 0.02, width - 0.02, grid);
        
        float gridAlpha = max(lines.x, lines.y);
        
        // Moire killer: aggressive fade to black at the far edges to hide the optical illusion
        gridAlpha *= smoothstep(0.05, 0.25, p.y);
        
        // Ground base color (dark blue / deep purple)
        col = vec3(0.02, 0.0, 0.12);
        
        // Lines use an electric cyan/blue tone
        vec3 lineColor = vec3(0.0, 0.8, 1.0);
        
        // Apply the grid
        col = mix(col, lineColor, gridAlpha);
        
        // Add a bright cyan/magenta fog layer as sky reflection on the ground at the horizon
        col += mix(vec3(0.8, 0.2, 0.7), vec3(0.2, 0.8, 1.0), abs(p.x)) * exp(-p.y * 12.0) * 0.5;
        
        // Fade to black at the edges to hide infinite-distance aliasing
        col *= smoothstep(0.0, 0.1, p.y);
    }

    fragColor = vec4(col, 1.0);
}

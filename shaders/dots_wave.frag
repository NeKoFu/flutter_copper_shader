#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float isAndroid;

out vec4 fragColor;

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    if (isAndroid > 0.5) {
        fragCoord.y = iResolution.y - fragCoord.y;
    }
    
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    // ro: ray origin (camera position)
    vec3 ro = vec3(0.0, 0.0, -8.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    // Slow vertical drift
    ro.y += iTime * 0.2;
    
    // Subtle camera sway
    ro.x += sin(iTime * 0.15) * 0.5;
    
    // Mouse interaction
    if (iMouse.x > 0.0 || iMouse.y > 0.0) {
        vec2 m = (iMouse.xy / iResolution.xy) - 0.5;
        rd.yz *= rot(-m.y * 2.0);
        rd.xz *= rot(m.x * 2.0);
        ro.yz *= rot(-m.y * 2.0);
        ro.xz *= rot(m.x * 2.0);
    }

    float depth = 0.0;
    vec3 col = vec3(0.0);
    float alpha_accum = 0.0;
    
    // Color palette based on the reference: 
    // Vibrant blue (top/one side) to Copper/orange (bottom/other side)
    vec3 colorBlue = vec3(0.0, 0.4, 1.0);
    vec3 colorOrange = vec3(1.0, 0.35, 0.1);
    
    for(int i = 0; i < 40; i++) {
        vec3 p = ro + rd * depth;
        vec3 q = p;
        
        // Ribbon sweeping curve
        q.x += sin(q.y * 0.35 + iTime * 0.3) * 2.0;
        q.z += cos(q.y * 0.4 + iTime * 0.25) * 2.0;
        
        // Ribbon twist
        float angle = q.y * 0.4 - iTime * 0.2;
        q.xz *= rot(angle);
        
        // Shape bounds
        float w = 2.5; // Width of the ribbon
        float th = 0.03; // Thickness of the ribbon
        
        // SDF for a thin plane bounded on x
        float dPlane = abs(q.z) - th;
        float dFull = max(dPlane, abs(q.x) - w);
        
        if (dFull < 0.06) {
            // We are close or inside the ribbon volume. 
            // Let's check the dot UV grid.
            // Using a distinct scale to get vertical continuous lines of dots
            vec2 dotUV = vec2(q.x * 15.0, p.y * 25.0);
            
            vec2 f = fract(dotUV) - 0.5;
            float dDot = length(f);
            
            float r = 0.25; // Dot radius
            
            if (dDot < r) {
                // Determine color based on spatial position to get that dual-tone look
                // We use global Y and global Z for the gradient
                float mixFactor = smoothstep(-2.5, 2.5, sin(p.y * 0.3 + p.x * 0.2 + iTime * 0.5) * 3.0);
                vec3 dotCol = mix(colorOrange, colorBlue, mixFactor);
                
                // Dim dots near the edges of the ribbon for a softer look
                float edgeFade = smoothstep(w, w - 0.8, abs(q.x));
                dotCol *= edgeFade;
                
                // Depth fade (black in the distance)
                float zFade = 1.0 / (1.0 + depth * depth * 0.0025);
                dotCol *= zFade;
                
                // Dot smoothing/AA
                float alpha = smoothstep(r, r - 0.1, dDot);
                
                // Front-to-back alpha blending
                col += dotCol * alpha * (1.0 - alpha_accum);
                
                // Dots are highly opaque in the center, soft on edges
                alpha_accum += alpha * 0.8;
                
                // Early exit if pixel is completely filled
                if (alpha_accum > 0.99) break;
            }
            
            // Advance through the ribbon volume to see behind it
            depth += 0.06;
            continue;
        }
        
        // Safe raymarching step
        depth += max(dFull * 0.6, 0.01);
        
        // Draw distance limit
        if (depth > 25.0) break;
    }
    
    // Extra glow pass effect
    col = smoothstep(0.0, 1.2, col);
    col = pow(col, vec3(0.85)); // slight gamma correction to boost colors
    
    // Vignette
    vec2 q = fragCoord / iResolution.xy;
    col *= 0.4 + 0.6 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.15);
    
    fragColor = vec4(col, 1.0);
}

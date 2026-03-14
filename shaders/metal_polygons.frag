#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float isAndroid;

out vec4 fragColor;

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

// Generates a sharp triangulated heightmap
float heightMap(vec2 p) {
    // scale and rotate domain
    p *= mat2(0.866025, -0.5, 0.5, 0.866025); // 30 deg
    p *= 1.2;
    
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    vec2 v00 = hash22(i);
    vec2 v10 = hash22(i + vec2(1.0, 0.0));
    vec2 v01 = hash22(i + vec2(0.0, 1.0));
    vec2 v11 = hash22(i + vec2(1.0, 1.0));
    
    float t = iTime * 0.6;
    
    float h00 = sin(t + v00.x * 6.2831) * 0.5;
    float h10 = sin(t + v10.x * 6.2831) * 0.5;
    float h01 = sin(t + v01.x * 6.2831) * 0.5;
    float h11 = sin(t + v11.x * 6.2831) * 0.5;
    
    float h;
    // Split quad into two triangles
    if (f.x > f.y) {
        h = h00 + f.x * (h10 - h00) + f.y * (h11 - h10);
    } else {
        h = h00 + f.y * (h01 - h00) + f.x * (h11 - h01);
    }
    
    // Layer 2
    p *= 2.0;
    i = floor(p); 
    f = fract(p);
    
    v00 = hash22(i); 
    v10 = hash22(i + vec2(1.0, 0.0));
    v01 = hash22(i + vec2(0.0, 1.0)); 
    v11 = hash22(i + vec2(1.0, 1.0));
    
    float h200 = sin(t*1.3 + v00.y * 6.2831) * 0.5;
    float h210 = sin(t*1.3 + v10.y * 6.2831) * 0.5;
    float h201 = sin(t*1.3 + v01.y * 6.2831) * 0.5;
    float h211 = sin(t*1.3 + v11.y * 6.2831) * 0.5;
    
    float h2;
    if (f.x + f.y < 1.0) {
        h2 = h200 + f.x * (h210 - h200) + f.y * (h201 - h200);
    } else {
        h2 = h211 + (1.0 - f.x) * (h201 - h211) + (1.0 - f.y) * (h210 - h211);
    }
    
    return h * 1.5 + h2 * 0.5;
}

float map(vec3 p) {
    return p.y - heightMap(p.xz);
}

vec3 calcNormal(in vec3 p) {
    const float h = 0.005; // Small step for sharp normals
    const vec2 k = vec2(1, -1);
    return normalize(k.xyy * map(p + k.xyy * h) + 
                     k.yyx * map(p + k.yyx * h) + 
                     k.yxy * map(p + k.yxy * h) + 
                     k.xxx * map(p + k.xxx * h));
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    if (isAndroid > 0.5) {
        fragCoord.y = iResolution.y - fragCoord.y;
    }
    
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    // Camera setup
    // Slightly angled down
    vec3 ro = vec3(0.0, 5.0, -5.0 + iTime*0.4); 
    vec3 rd = normalize(vec3(uv.x, uv.y - 0.5, 1.0));
    
    // Mouse rotation
    if (iMouse.x > 0.0 || iMouse.y > 0.0) {
        vec2 m = (iMouse.xy / iResolution.xy) - 0.5;
        float rotX = -m.y * 2.0;
        float rotY = m.x * 2.0;
        
        mat2 rX = mat2(cos(rotX), -sin(rotX), sin(rotX), cos(rotX));
        mat2 rY = mat2(cos(rotY), -sin(rotY), sin(rotY), cos(rotY));
        
        rd.yz *= rX;
        rd.xz *= rY;
    }

    float depth = 0.0;
    float dist = 0.0;
    vec3 p;
    
    // Raymarching
    for(int i = 0; i < 80; i++) {
        p = ro + rd * depth;
        dist = map(p);
        if(dist < 0.005 || depth > 20.0) break;
        // Decrease step size to prevent jumping through sharp geometry
        depth += dist * 0.45; 
    }
    
    vec3 col = vec3(0.02); // VERY dark background
    
    if (depth < 20.0) {
        vec3 n = calcNormal(p);
        
        // Base dark metal color
        vec3 baseColor = vec3(0.05, 0.07, 0.09);
        
        // Lighting
        vec3 lightDir1 = normalize(vec3(sin(iTime*0.3), 1.0, -1.0)); // ambient / rim light
        vec3 lightDir2 = normalize(vec3(0.5, 0.8, 1.2)); // main light
        
        // Specular reflections
        vec3 viewDir = -rd;
        vec3 halfDir1 = normalize(lightDir1 + viewDir);
        vec3 halfDir2 = normalize(lightDir2 + viewDir);
        
        float spec1 = pow(max(dot(n, halfDir1), 0.0), 32.0);
        float spec2 = pow(max(dot(n, halfDir2), 0.0), 64.0);
        
        float diff1 = max(dot(n, lightDir1), 0.0);
        float diff2 = max(dot(n, lightDir2), 0.0);
        
        // Let's add an environment reflection fake
        vec3 ref = reflect(rd, n);
        float envSpec = pow(max(dot(ref, vec3(0.0, 1.0, 0.0)), 0.0), 16.0);
        float envSpec2 = pow(max(dot(ref, normalize(vec3(1.0, 0.5, 1.0))), 0.0), 24.0);
        
        vec3 lightColor1 = vec3(0.3, 0.4, 0.6); // cool blueish
        vec3 lightColor2 = vec3(0.8, 0.8, 0.85); // bright white
        
        col = baseColor * (diff1 * 0.5 + diff2 * 0.5 + 0.2); // slight ambient
        
        // Add strong specular highlights for that "metal" effect
        col += lightColor1 * spec1 * 1.5;
        col += lightColor2 * spec2 * 2.0;
        
        // environment reflection
        col += lightColor1 * envSpec * 0.8;
        col += vec3(0.6, 0.7, 0.8) * envSpec2 * 0.6;
        
        // Fade to black in the distance
        col = mix(col, vec3(0.01), smoothstep(10.0, 20.0, depth));
    }
    
    // Vignetting
    vec2 q = fragCoord / iResolution.xy;
    col *= 0.5 + 0.5 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.2);
    
    // Contrast boost
    col = smoothstep(0.0, 1.0, col);
    col = pow(col, vec3(1.1));
    
    fragColor = vec4(col, 1.0);
}

#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

// Zippy Zaps by Nguyen2007
// Original source: https://www.shadertoy.com/view/XXyGzh

void main()
{
    vec2 fragCoord = FlutterFragCoord().xy;
    vec2 v = iResolution.xy;
    vec2 w;
    // Normalized coordinates
    vec2 u = 0.2 * (fragCoord * 2.0 - v) / v.y;
    vec2 k = u;
         
    vec4 o = vec4(1.0, 2.0, 3.0, 0.0);
     
    float a = 0.5;
    float t = iTime;
    float i = 0.0;
    
    // Core loop: de-golfed and explicit types for Impeller compatibility
    for (int iter = 0; iter < 19; iter++) {
        i += 1.0;
        t += 1.0;
        a += 0.03;
        
        v = cos(t - 7.0 * u * pow(a, i)) - 5.0 * u;
        
        // Explicit mat2 construction from vec4 to avoid column-major confusion across backends
        vec4 matArgs = cos(i + t * 0.02 - vec4(0.0, 11.0, 33.0, 0.0));
        mat2 rot = mat2(matArgs.x, matArgs.y, matArgs.z, matArgs.w);
        u *= rot;
        
        u += 0.005 * tanh(40.0 * dot(u,u) * cos(100.0 * vec2(u.y, u.x) + t))
           + 0.2 * a * u
           + 0.003 * cos(t + 4.0 * exp(-0.01 * dot(o,o)));
           
        w = u / (1.0 - 2.0 * dot(u,u));
        
        vec4 cosVec = 1.0 + cos(vec4(0.0, 1.0, 3.0, 0.0) + t);
        float len = length((1.0 + i * dot(v,v)) * sin(w * 3.0 - 9.0 * vec2(u.y, u.x) + t));
        o += cosVec / len;
    }
              
    // Tone mapping and stabilization
    o = 1.0 - sqrt(exp(-o*o*o / 200.0));
    o = pow(o, vec4(0.3));
    
    k -= u;
    o -= dot(k, k) / 250.0;
    
    fragColor = vec4(o.rgb, 1.0);
}

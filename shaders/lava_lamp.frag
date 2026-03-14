#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform float isAndroid;

uniform float bgR;
uniform float bgG;
uniform float bgB;
uniform float bubbleR;
uniform float bubbleG;
uniform float bubbleB;

out vec4 fragColor;

float opSmoothUnion( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
} 

float map(vec3 p)
{
    // Main lower blob (heat source), shifted slightly downward
    float d = sdSphere(p - vec3(0.0, -5.5, 0.0), 2.6);
    // Main upper blob (cooling), shifted slightly upward
    d = opSmoothUnion(d, sdSphere(p - vec3(0.0, 5.5, 0.0), 2.0), 2.0);
    
	for (int i = 0; i < 10; i++) {
	 	float fi = float(i);
        
        // Unique parameters for each bubble
        float speed = 0.4 + fract(fi * 412.531) * 0.8;
        float phase = fi * 123.456;
        
        // Purely vertical movement from bottom to top
        // The blob wraps from -7.0 to 7.0 so it has enough time
        // to leave the visible screen area (which spans from -5 to 5).
        float y = mod(iTime * speed + phase, 14.0) - 7.0;
        
        // Very slight X and Z drift for more natural motion
        float x = sin(fi * 52.5126 + iTime * 0.3) * 1.2;
        float z = cos(fi * 64.6274 + iTime * 0.2) * 1.2;
        
        // Variable bubble size
        float rad = mix(0.4, 1.3, fract(fi * 412.531 + 0.5124));
        
        // Merge the bubble with the rest of the "wax"
		d = opSmoothUnion(sdSphere(p - vec3(x, y, z), rad), d, 1.0);
	}
	return d;
}

vec3 calcNormal( in vec3 p )
{
    const float h = 1e-4; 
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*map( p + k.xyy*h ) + 
                      k.yyx*map( p + k.yyx*h ) + 
                      k.yxy*map( p + k.yxy*h ) + 
                      k.xxx*map( p + k.xxx*h ) );
}

void main()
{
    vec2 fragCoord = FlutterFragCoord().xy;
    // Fix Y-axis inversion on Android
    if (isAndroid > 0.5) {
        fragCoord.y = iResolution.y - fragCoord.y;
    }
    vec2 uv = fragCoord/iResolution.xy;
    
    // Screen size mapping, centered
	vec3 rayOri = vec3((uv - 0.5) * vec2(iResolution.x/iResolution.y, 1.0) * 10.0, 6.0);
	vec3 rayDir = normalize(vec3(0.0, 0.0, -1.0));
	
	float depth = 0.0;
	vec3 p;
	
    // Raymarching
	for(int i = 0; i < 48; i++) {
		p = rayOri + rayDir * depth;
		float dist = map(p);
        if (dist < 0.01) {
			break;
		}
        depth += dist;
        if (depth > 15.0) {
            break;
        }
	}
	
    // Primary colors from uniforms
    vec3 baseBg = vec3(bgR, bgG, bgB);
    vec3 baseBubble = vec3(bubbleR, bubbleG, bubbleB);
    
    // Light from the halogen bulb in the background (warm yellow/orange)
    vec3 bulbLight = vec3(1.0, 0.6, 0.1);
    
    // The liquid background is strongly lit from below
    vec3 col = mix(bulbLight * 0.9, baseBg, clamp(uv.y * 1.5, 0.0, 1.0));
    
    if (depth < 15.0) {
        vec3 n = calcNormal(p);
        
        // Soft directional lighting
        vec3 lightDir = normalize(vec3(0.3, 0.8, 0.5));
        
        // Half-Lambert diffuse for soft, organic materials
        float diff = clamp((dot(n, lightDir) + 0.5) / 1.5, 0.0, 1.0);
        float amb = 0.5 + 0.5 * dot(n, vec3(0.0, 1.0, 0.0));
        
        // Wax color: very warm yellow at the bottom, shifting toward the base color (magenta) higher up
        float heightFactor = clamp((p.y + 7.0) / 12.0, 0.0, 1.0);
        vec3 lavaCol = mix(bulbLight * 1.2, baseBubble, smoothstep(0.1, 0.6, heightFactor));
        
        // Deep subsurface effect as light rises from below through the material
        float sss = pow(clamp(-n.y, 0.0, 1.0), 1.5);
        lavaCol += bulbLight * sss * 0.8; 
        
        // Specular highlight: very soft and broad for a matte, waxy look instead of glass
        vec3 h = normalize(lightDir - rayDir);
        float spec = pow(max(0.0, dot(n, h)), 8.0);
        
        // Final composition without a reflective effect
        col = lavaCol * (diff * 0.6 + amb * 0.4);
        col += vec3(1.0, 0.9, 0.7) * spec * 0.08; // Very subtle sheen (0.08 instead of 0.5)
        
        // Fresnel edges: the wax picks up the liquid color at grazing angles
        float fre = pow(1.0 - max(dot(n, -rayDir), 0.0), 2.0);
        col = mix(col, baseBg * 1.5, fre * 0.6);
    }
    
    // Vignette
    col *= 1.0 - 0.4 * length(uv - 0.5);
	
    fragColor = vec4(col, 1.0);
}

#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

out vec4 fragColor;

// ***********************************************************
// Alcatraz / Rhodium 4k Intro liquid carbon (Buffer A logic)
// by Jochen "Virgill" Feldkötter
// ***********************************************************

float bounce;

// signed box
float sdBox(vec3 p,vec3 b)
{
  vec3 d=abs(p)-b;
  return min(max(d.x,max(d.y,d.z)),0.)+length(max(d,0.));
}

// rotation
void pR(inout vec2 p,float a) 
{
	p=cos(a)*p+sin(a)*vec2(p.y,-p.x);
}

// 3D noise function (IQ)
float noise(vec3 p)
{
	vec3 ip=floor(p);
    p-=ip; 
    vec3 s=vec3(7,157,113);
    vec4 h=vec4(0.,s.yz,s.y+s.z)+dot(ip,s);
    p=p*p*(3.-2.*p); 
    h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);
    h.xy=mix(h.xz,h.yw,p.y);
    return mix(h.x,h.y,p.z); 
}

float map(vec3 p)
{	
	p.z-=1.0;
    p*=1.2;
    pR(p.yz,bounce*1.+0.4*p.x);
    return sdBox(p+vec3(0,sin(1.6*iTime),0),vec3(20.0, 0.05, 1.2))-.4*noise(8.*p+3.*bounce);
}

//	normal calculation
vec3 calcNormal(vec3 pos)
{
    float eps=0.0001;
	float d=map(pos);
	return normalize(vec3(map(pos+vec3(eps,0,0))-d,map(pos+vec3(0,eps,0))-d,map(pos+vec3(0,0,eps))-d));
}


// 	standard sphere tracing inside and outside
float castRayx(vec3 ro,vec3 rd) 
{
    float function_sign=(map(ro)<0.)?-1.:1.;
    float precis=.0001;
    float h=precis*2.;
    float t=0.;
	// Opti mobile: Raymarching steps reduced from 120 to 30
	for(int i=0;i<30;i++) 
	{
        if(abs(h)<precis||t>12.)break;
		h=function_sign*map(ro+rd*t);
        t+=h;
	}
    return t;
}

// 	refraction
float refr(vec3 pos,vec3 lig,vec3 dir,vec3 nor,float angle,out float t2, out vec3 nor2)
{
    float h=0.;
    t2=2.;
	vec3 dir2=refract(dir,nor,angle);  
	// Opti mobile: Refraction steps reduced from 50 to 15
 	for(int i=0;i<15;i++) 
	{
		if(abs(h)>3.) break;
		h=map(pos+dir2*t2);
		t2-=h;
	}
    nor2=calcNormal(pos+dir2*t2);
    return(.5*clamp(dot(-lig,nor2),0.,1.)+pow(max(dot(reflect(dir2,nor2),lig),0.),8.));
}

//	softshadow 
float softshadow(vec3 ro,vec3 rd) 
{
    float sh=1.;
    float t=.02;
    float h=.0;
    // Opti mobile: Softshadow steps reduced from 22 to 10
    for(int i=0;i<10;i++)  
	{
        if(t>20.)continue;
        h=map(ro+rd*t);
        sh=min(sh,4.*h/t);
        t+=h;
    }
    return sh;
}

//	main function
void main()
{    
    vec2 fragCoord = FlutterFragCoord().xy;
    //bounce=abs(fract(0.05*iTime)-.5)*20.; // triangle function
    bounce = iTime * -0.8; // Mouvement continu vers l'avant

    
	vec2 uv=fragCoord.xy/iResolution.xy; 
    vec2 p=uv*2.-1.;
    
//  camera    
    vec2 screenPos = 2.0 * fragCoord.xy - iResolution.xy;
    // Rotate the scene by swapping the X and Y axes
    vec3 dir = normalize(vec3(-screenPos.y, screenPos.x, iResolution.x));
    vec3 org = vec3(0., 0., -3.);  

// 	standard sphere tracing:
    vec3 color = vec3(0.);
    vec3 color2 =vec3(0.);
    float t=castRayx(org,dir);
	vec3 pos=org+dir*t;
	vec3 nor=calcNormal(pos);

// 	lighting:
    vec3 lig=normalize(vec3(.2,6.,.5));
//	scene depth    
    float depth=clamp((1.-0.09*t),0.,1.);
    
    vec3 pos2 = vec3(0.);
    vec3 nor2 = vec3(0.);
    if(t<12.0)
    {
    	color2 = vec3(max(dot(lig,nor),0.)  +  pow(max(dot(reflect(dir,nor),lig),0.),16.));
    	color2 *=clamp(softshadow(pos,lig),0.,1.);  // shadow            	
       	float t2;
		color2 +=refr(pos,lig,dir,nor,0.9, t2, nor2)*depth;
        color2-=clamp(.1*t2,0.,1.);				// inner intensity loss

	}      
  

    float tmp = 0.;
    float T = 1.;

//	animation of glow intensity    
    float intensity = 0.1*-sin(.209*iTime+1.)+0.05; 
	// Opti mobile: Volumetric glow loops strongly reduced from 128 to 18. Step distance compensated.
	for(int i=0; i<18; i++)
	{
        float density = 0.; float nebula = noise(org+bounce);
        density=intensity-map(org+.5*nor2)*nebula;
		if(density>0.)
		{
			tmp = density / 40.;
            T *= 1. -tmp * 100.;
			if( T <= 0.) break;
		}
		org += dir*0.25;
    }    
	vec3 basecol=vec3(1./1. ,  1./4. , 1./16.);
    T=clamp(T,0.,1.5); 
    color += basecol* exp(4.*(0.5-T) - 0.8);
    color2*=depth;
    color2+= (1.-depth)*noise(6.*dir+0.3*iTime)*.1;	// subtle mist

    
//	We skip the depth-of-field post-process pass (which needed iChannel0 multi-pass in ShaderToy)
//  and output the crystal clear liquid carbon directly.
    fragColor = vec4(vec3(1.*color+0.8*color2)*1.3, 1.0);
}

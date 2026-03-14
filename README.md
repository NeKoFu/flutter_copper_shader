# Flutter Copper Shader

Integrate GLSL shader backgrounds into your Flutter applications with ease. `flutter_copper_shader` provides a highly performant, Impeller-ready way to parse and render fragment shaders (like those found on ShaderToy) natively in your application.

## Features

- **Standard ShaderToy Mapping:** Automatically maps standard uniforms like `iTime`, `iResolution` and `iMouse`.
- **Texture Support (`iChannel0-3`):** Supports up to 4 simultaneous image samplers through asynchronous loading and caching.
- **Custom Parameters:** Easily inject custom variables directly into the GLSL via `customParams`.
- **High Performance:** Isolates rendering within a `RepaintBoundary` and uses a lightweight `CustomPainter` synced onto the display refresh rate (Ticker).
- **Interactive:** Built-in gesture detection to dynamically update shader physics via `iMouse`.

<p align="center">
  <img style="height: 480px;" src="https://raw.githubusercontent.com/NeKoFu/flutter_copper_shader/refs/heads/main/shaders.png" />
</p>

## Installation

Add the following to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_copper_shader: ^1.0.0
```

_Note: Since this package relies on standard Flutter shader fragments, ensure your Flutter SDK is `^3.41.1` or higher._

## Setup & Usage

### 1. Declare your Shaders

First, add your `.frag` files to your project. By convention, they are usually placed in a folder named `shaders/`. You must declare them under the `flutter` section in your `pubspec.yaml` so they compile appropriately.

```yaml
flutter:
  shaders:
    - shaders/my_shader.frag
```

### 2. Implementation

To use a shader as a background, simply use the `CopperShader` widget and provide the asset path.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_copper_shader/flutter_copper_shader.dart';

class MyCoolBackground extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Render the shader in the background
          Positioned.fill(
            child: CopperShader(
              shaderPath: 'shaders/my_shader.frag',
              // Optional: Provide texture images corresponding to iChannel0, 1, etc.
              // images: ['assets/texture1.png'],
              isInteractive: true, // Enables iMouse updating on touch/drag
            ),
          ),
          // Your foreground UI goes here
          Center(
            child: Text(
              'Hello World!',
              style: TextStyle(color: Colors.white, fontSize: 32),
            ),
          ),
        ],
      ),
    );
  }
}
```

## Shader Specs & GLSL

Written in `GLSL ES 100` (or compatible), your shaders must integrate the Flutter runtime effect inclusion. Here is an example template you should follow to port shaders from ShaderToy:

```glsl
#version 460 core

#include <flutter/runtime_effect.glsl>

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
// uniform float uCustomParams[X]; // Inject custom float scales here mapped to [customParams]
// uniform sampler2D iChannel0;    // Textures mapped from the [images] list

out vec4 fragColor;

void main() {
    // Standard normalized coordinates
    vec2 uv = FlutterFragCoord().xy / iResolution.xy;

    vec3 color = vec3(0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4)));

    fragColor = vec4(color, 1.0);
}
```

## Example Application

Check out the [example](https://github.com/NeKoFu/flutter_copper_shader/tree/main/example) folder in this repository for a comprehensive visual showcase featuring dynamic shader swapping, Plasma, and Starfield effects.

## Credits & Acknowledgements

This package includes several shaders inspired by or adapted from the incredible work of artists on [ShaderToy](https://www.shadertoy.com/):

- The Universe Within - by **Martijn Steinrucken** aka BigWings 2018
- Auroras - by **nimitz** 2017
- 2D Clouds - by **drift** 2016
- Rhodium - by Jochen **"Virgill"** Feldkötter
- Sparks drifting - **Ian McEwan**, Ashima Arts 2017

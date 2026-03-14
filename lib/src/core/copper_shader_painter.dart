import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// An optimized CustomPainter for drawing the animated background with a FragmentShader.
class CopperShaderPainter extends CustomPainter {
  final ui.FragmentShader shader;
  final List<ui.Image>? images;
  final List<double>? customParams;
  final double time;
  final Offset mouse;

  CopperShaderPainter({
    required this.shader,
    required this.time,
    required this.mouse,
    this.images,
    this.customParams,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Pipeline GLSL : Uniform Mapping (ShaderToy Standard)
    
    // 0: iTime (double)
    shader.setFloat(0, time);
    // 1-2: iResolution (vec2)
    shader.setFloat(1, size.width);
    shader.setFloat(2, size.height);
    // 3-4: iMouse (vec2)
    shader.setFloat(3, mouse.dx);
    shader.setFloat(4, mouse.dy);

    // 5+: Custom params
    if (customParams != null) {
      for (int i = 0; i < customParams!.length; i++) {
        shader.setFloat(5 + i, customParams![i]);
      }
    }

    // Texture handling (iChannel0-3)
    if (images != null) {
      // Up to 4 samplers are supported
      for (int i = 0; i < images!.length && i < 4; i++) {
        shader.setImageSampler(i, images![i]);
      }
    }

    // Paint on the canvas without resizing or heavy masking
    final paint = Paint()..shader = shader;
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CopperShaderPainter oldDelegate) {
    return oldDelegate.time != time ||
           oldDelegate.mouse != mouse ||
           oldDelegate.shader != shader ||
           oldDelegate.images != images ||
           oldDelegate.customParams != customParams;
  }
}

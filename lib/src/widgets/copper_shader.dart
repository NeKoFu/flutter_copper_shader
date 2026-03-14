import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import '../core/copper_shader_painter.dart';
import '../loaders/shader_loader.dart';
import '../loaders/image_loader.dart';

/// A performant widget that renders an animated GLSL or SPIR-V `.frag` background.
class CopperShader extends StatefulWidget {
  final String shaderPath;           // Shader path (.frag)
  final List<String>? images;        // Up to 4 image assets
  final List<double>? customParams;  // Additional parameters
  final Widget? child;               // Content displayed above the background
  final bool isInteractive;          // Enables/disables iMouse
  
  const CopperShader({
    super.key,
    required this.shaderPath,
    this.images,
    this.customParams,
    this.child,
    this.isInteractive = true,
  });

  @override
  State<CopperShader> createState() => _CopperShaderState();
}

class _CopperShaderState extends State<CopperShader> with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  ui.FragmentShader? _shader;
  List<ui.Image>? _loadedImages;

  double _elapsedSeconds = 0.0;
  Offset _mousePosition = Offset.zero;

  @override
  void initState() {
    super.initState();
    _initShader();
    _loadImages();

    // Ticker synced with the display refresh rate for 60/120 FPS
    _ticker = createTicker((elapsed) {
      if (_shader != null) {
        setState(() {
          _elapsedSeconds = elapsed.inMilliseconds / 1000.0;
        });
      }
    });
    _ticker.start();
  }

  Future<void> _initShader() async {
    try {
      final program = await ShaderLoader().load(widget.shaderPath);
      if (mounted) {
        setState(() {
          _shader = program.fragmentShader();
        });
      }
    } catch (e) {
      debugPrint("Erreur lors du chargement du shader : $e");
    }
  }

  Future<void> _loadImages() async {
    if (widget.images == null || widget.images!.isEmpty) return;

    List<ui.Image> loaded = [];
    final imageLoader = ImageLoader();
    
    for (var path in widget.images!) {
      try {
        final img = await imageLoader.load(path);
        loaded.add(img);
      } catch (e) {
        debugPrint("Erreur lors du chargement de la texture : $e");
      }
    }

    if (mounted) {
      setState(() {
        _loadedImages = loaded;
      });
    }
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_shader == null) {
      return widget.child ?? const SizedBox.shrink();
    }

    Widget content = RepaintBoundary(
      child: CustomPaint(
        painter: CopperShaderPainter(
          shader: _shader!,
          time: _elapsedSeconds,
          mouse: _mousePosition,
          images: _loadedImages,
          customParams: widget.customParams,
        ),
      ),
    );

    // If the widget is interactive (iMouse enabled), wrap it in a GestureDetector
    if (widget.isInteractive) {
      content = GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            _mousePosition = details.localPosition;
          });
        },
        onPanDown: (details) {
          setState(() {
            _mousePosition = details.localPosition;
          });
        },
        child: content,
      );
    }

    return Stack(
      children: [
        Positioned.fill(child: content),
        if (widget.child != null)
          Positioned.fill(child: widget.child!),
      ],
    );
  }
}

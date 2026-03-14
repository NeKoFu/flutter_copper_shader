import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// Utility for loading and caching `ui.Image` objects from assets.
class ImageLoader {
  static final ImageLoader _instance = ImageLoader._internal();
  factory ImageLoader() => _instance;
  ImageLoader._internal();

  final Map<String, ui.Image> _cache = {};

  /// Loads an image from assets with caching, ready for the shader `setImageSampler` call.
  Future<ui.Image> load(String assetPath) async {
    if (_cache.containsKey(assetPath)) {
      return _cache[assetPath]!;
    }

    try {
      final ImageProvider provider = AssetImage(assetPath);
      final ImageStream stream = provider.resolve(ImageConfiguration.empty);
      
      final completer = Completer<ui.Image>();
      ImageStreamListener? listener;
      
      listener = ImageStreamListener(
        (ImageInfo info, bool syncCall) {
          completer.complete(info.image);
          // Remove the listener once the image has loaded.
          stream.removeListener(listener!);
        },
        onError: (dynamic exception, StackTrace? stackTrace) {
          completer.completeError(exception, stackTrace);
          stream.removeListener(listener!);
        },
      );
      
      stream.addListener(listener);

      final img = await completer.future;
      _cache[assetPath] = img;
      return img;
    } catch (e) {
      throw Exception('Erreur lors du chargement de l\'image $assetPath : $e');
    }
  }

  /// Clears the cache while properly disposing `ui.Image` GPU resources.
  void clearCache() {
    for (var image in _cache.values) {
      image.dispose();
    }
    _cache.clear();
  }
}

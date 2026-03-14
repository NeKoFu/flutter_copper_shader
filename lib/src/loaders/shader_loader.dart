import 'dart:ui' as ui;

/// Utility for loading and caching `ui.FragmentProgram` objects.
class ShaderLoader {
  static final ShaderLoader _instance = ShaderLoader._internal();
  factory ShaderLoader() => _instance;
  ShaderLoader._internal();

  final Map<String, ui.FragmentProgram> _cache = {};

  /// Loads a shader from assets with caching.
  Future<ui.FragmentProgram> load(String assetPath) async {
    if (_cache.containsKey(assetPath)) {
      return _cache[assetPath]!;
    }

    try {
      final program = await ui.FragmentProgram.fromAsset(assetPath);
      _cache[assetPath] = program;
      return program;
    } catch (e) {
      throw Exception('Erreur lors du chargement du shader $assetPath : $e');
    }
  }

  /// Clears the shader cache.
  void clearCache() {
    _cache.clear();
  }
}

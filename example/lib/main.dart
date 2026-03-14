import 'package:animate_do/animate_do.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_copper_shader/flutter_copper_shader.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Copper Shader Example',
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
      ),
      
      home: const ShaderExamplePage(),
    );
  }
}

class ShaderExamplePage extends StatefulWidget {
  const ShaderExamplePage({super.key});

  @override
  State<ShaderExamplePage> createState() => _ShaderExamplePageState();
}

class _ShaderExamplePageState extends State<ShaderExamplePage> {
  bool _showOptions = true;

  // List of available shaders sorted alphabetically, with the full package path
  final Map<String, String> _shaders = {
    'Animated Gradient': 'packages/flutter_copper_shader/shaders/animated_gradient.frag',
    'Auroras': 'packages/flutter_copper_shader/shaders/auroras.frag',
    'Clouds': 'packages/flutter_copper_shader/shaders/clouds.frag',
    'Crystallize': 'packages/flutter_copper_shader/shaders/crystallize.frag',
    'Dark Matter': 'packages/flutter_copper_shader/shaders/dark_matter.frag',
    'Dots Wave': 'packages/flutter_copper_shader/shaders/dots_wave.frag',
    'Kaleidoscope': 'packages/flutter_copper_shader/shaders/kaleidoscope.frag',
    'Lava Lamp': 'packages/flutter_copper_shader/shaders/lava_lamp.frag',
    'Metal Polygons': 'packages/flutter_copper_shader/shaders/metal_polygons.frag',
    'Ocean Gradient': 'packages/flutter_copper_shader/shaders/ocean_gradient.frag',
    'Plasma Effect': 'packages/flutter_copper_shader/shaders/plasma.frag',
    'Quantum Particles': 'packages/flutter_copper_shader/shaders/quantum_particles.frag',
    'Retro Grid': 'packages/flutter_copper_shader/shaders/retro_grid.frag',
    'Rhodium Liquid Carbon': 'packages/flutter_copper_shader/shaders/rhodium_liquid_carbon.frag',
    'Sparks': 'packages/flutter_copper_shader/shaders/sparks.frag',
    'Starfield Effect': 'packages/flutter_copper_shader/shaders/starfield.frag',
    'Universe Within': 'packages/flutter_copper_shader/shaders/universe_within.frag',
    'Vapor Wave': 'packages/flutter_copper_shader/shaders/vapor_wave.frag',
    'Water Caustics': 'packages/flutter_copper_shader/shaders/water_caustics.frag',
    'Zippy Zaps': 'packages/flutter_copper_shader/shaders/zippy_zaps.frag',
  };

  // Customizable colors (alpha is ignored, only RGB is passed)
  final List<double> _gradientColors = [
      115/255, 237/255,  79/255,  // Green (top-left)
      255/255,  59/255, 143/255,  // Pink/Orange (bottom-left)
      113/255,  61/255, 255/255,  // Purple/Indigo (bottom-right)
      204/255,  68/255, 255/255,  // Magenta/Purple (top-right)
  ];

  // Primary color for the Dark Matter shader (the original magenta glow: HDR values 3.5, 1.0, 4.5)
  // You can replace them with standard, more moderate RGB values such as 0.0, 1.0, 0.5
  final List<double> _darkMatterColor = [
      3.5, 1.0, 4.5,
  ];

  late String _selectedShaderName;

  @override
  void initState() {
    super.initState();
    _selectedShaderName = _shaders.keys.first;
  }

  List<double>? _getCustomParams(String shaderName) {
    final isAndroidNative = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

    return switch (shaderName) {
      'Animated Gradient' => _gradientColors,
      'Dark Matter'       => _darkMatterColor,
      'Sparks'
      || 'Retro Grid' 
      || 'Metal Polygons' 
      || 'Dots Wave' 
      || 'Vapor Wave' 
      || 'Aurora Coast'   => [isAndroidNative ? 1.0 : 0.0],
      'Lava Lamp'         => [
                              isAndroidNative ? 1.0 : 0.0,
                              100 / 255, 20 / 255, 150 / 255, // BG Color
                              255 / 255, 20 / 255, 100 / 255  // Bubble Color
                            ],
      _ => null,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          setState(() {
            _showOptions = !_showOptions;
          });
        },
        child: _showOptions ? const Icon(Icons.close) : const Icon(Icons.menu),
      ),
      // Layer 1: background with CopperShader
      body: Stack(
        children: [
          // Background shader
          Positioned.fill(
            // Add a ValueKey to force CopperShader to rebuild when the shader changes
            key: ValueKey(_selectedShaderName),
            child: CopperShader(
              shaderPath: _shaders[_selectedShaderName]!,
              customParams: _getCustomParams(_selectedShaderName),
              isInteractive: true,
            ),
          ),
          
          // Layer 2: foreground content (title, description, dropdown list)
          if(_showOptions) Positioned.fill(
            child: SafeArea(
              child: Center(
                child: FadeInUp(
                  duration: const Duration(milliseconds: 400),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Container(
                      padding: const EdgeInsets.all(32.0),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(24.0),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.5),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Text(
                            'Copper Shader',
                            style: TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Integrate GLSL shader backgrounds with Flutter.\n\n'
                            'Select a shader below.',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white.withValues(alpha: 0.8),
                              height: 1.5,
                            ),
                            textAlign: TextAlign.left,
                          ),
                          const SizedBox(height: 32),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                            ),
                            // Dropdown list used to select the shader
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedShaderName,
                                isExpanded: true,
                                dropdownColor: Colors.grey[900],
                                icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                                onChanged: (String? newValue) {
                                  if (newValue != null) {
                                    setState(() {
                                      _selectedShaderName = newValue;
                                    });
                                  }
                                },
                                items: _shaders.keys.map<DropdownMenuItem<String>>((String name) {
                                  return DropdownMenuItem<String>(
                                    value: name,
                                    child: Text(name),
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            '💡 Touch the screen to interact with the shader.',
                            style: TextStyle(
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                              color: Colors.white54,
                            ),
                            textAlign: TextAlign.left,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

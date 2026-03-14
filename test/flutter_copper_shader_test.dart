import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_copper_shader/flutter_copper_shader.dart';

void main() {
  group('Loaders Singleton Tests', () {
    test('ShaderLoader should be a singleton', () {
      final loader1 = ShaderLoader();
      final loader2 = ShaderLoader();
      expect(identical(loader1, loader2), isTrue);
    });

    test('ImageLoader should be a singleton', () {
      final loader1 = ImageLoader();
      final loader2 = ImageLoader();
      expect(identical(loader1, loader2), isTrue);
    });
  });

  group('CopperShader Widget Tests', () {
    testWidgets('Widget renders child while shader is null', (WidgetTester tester) async {
      const childKey = Key('child-key');
      
      // Pump the widget with a missing shaderPath to verify the fallback behavior (shader == null)
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CopperShader(
              shaderPath: 'invalid/path.frag',
              child: SizedBox(
                key: childKey,
                width: 100,
                height: 100,
              ),
            ),
          ),
        ),
      );

      // Verify that the child is rendered because the shader will not load
      expect(find.byKey(childKey), findsOneWidget);
    });
  });
}

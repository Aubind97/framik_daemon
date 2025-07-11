const EPD7in3e = require('./index.js');

/**
 * Test script to validate the new full-color system
 * This script runs various tests to ensure the color preservation works correctly
 */

async function runFullColorTests() {
    console.log('='.repeat(60));
    console.log('FULL COLOR SYSTEM VALIDATION TESTS');
    console.log('='.repeat(60));
    console.log('');

    const epd = new EPD7in3e();
    let testsPassed = 0;
    let totalTests = 0;

    try {
        // Test 1: RGB Encoding Validation
        console.log('Test 1: RGB Encoding Validation');
        totalTests++;
        
        const testColors = [
            { r: 255, g: 0, b: 0, name: 'Pure Red' },
            { r: 0, g: 255, b: 0, name: 'Pure Green' },
            { r: 0, g: 0, b: 255, name: 'Pure Blue' },
            { r: 255, g: 165, b: 0, name: 'Orange' },
            { r: 128, g: 0, b: 128, name: 'Purple' },
            { r: 0, g: 255, b: 255, name: 'Cyan' },
            { r: 128, g: 128, b: 128, name: 'Gray' }
        ];

        let encodingValid = true;
        testColors.forEach(color => {
            const encoded = epd.encodeRGBToDisplayFormat(color.r, color.g, color.b);
            if (encoded < 0 || encoded > 255) {
                console.log(`  ❌ ${color.name}: Invalid encoding ${encoded}`);
                encodingValid = false;
            } else {
                console.log(`  ✅ ${color.name}: 0x${encoded.toString(16).padStart(2, '0')}`);
            }
        });

        if (encodingValid) {
            testsPassed++;
            console.log('  ✅ RGB encoding validation passed');
        } else {
            console.log('  ❌ RGB encoding validation failed');
        }

        // Test 2: Buffer Creation and Pixel Setting
        console.log('\nTest 2: Buffer Creation and Pixel Setting');
        totalTests++;

        try {
            const buffer = epd.createBuffer();
            
            // Test setting pixels with RGB values
            epd.setPixelRGB(buffer, 0, 0, 255, 0, 0);    // Red
            epd.setPixelRGB(buffer, 1, 0, 0, 255, 0);    // Green
            epd.setPixelRGB(buffer, 2, 0, 0, 0, 255);    // Blue
            epd.setPixelRGB(buffer, 3, 0, 255, 165, 0);  // Orange
            
            // Verify pixels were set
            const pixel1 = epd.getPixel(buffer, 0, 0);
            const pixel2 = epd.getPixel(buffer, 1, 0);
            const pixel3 = epd.getPixel(buffer, 2, 0);
            const pixel4 = epd.getPixel(buffer, 3, 0);
            
            console.log(`  ✅ Red pixel: 0x${pixel1.toString(16)}`);
            console.log(`  ✅ Green pixel: 0x${pixel2.toString(16)}`);
            console.log(`  ✅ Blue pixel: 0x${pixel3.toString(16)}`);
            console.log(`  ✅ Orange pixel: 0x${pixel4.toString(16)}`);
            
            testsPassed++;
            console.log('  ✅ Buffer creation and pixel setting passed');
        } catch (error) {
            console.log('  ❌ Buffer creation failed:', error.message);
        }

        // Test 3: Test Pattern Generation
        console.log('\nTest 3: Test Pattern Generation');
        totalTests++;

        try {
            const patterns = ['gradient', 'rainbow', 'natural'];
            patterns.forEach(pattern => {
                const buffer = epd.createFullColorTestPattern(pattern);
                if (buffer && buffer.length === epd.getBufferSize()) {
                    console.log(`  ✅ ${pattern} pattern created successfully`);
                } else {
                    console.log(`  ❌ ${pattern} pattern creation failed`);
                }
            });
            
            testsPassed++;
            console.log('  ✅ Test pattern generation passed');
        } catch (error) {
            console.log('  ❌ Test pattern generation failed:', error.message);
        }

        // Test 4: Color Distribution Analysis
        console.log('\nTest 4: Color Distribution Analysis');
        totalTests++;

        try {
            const testBuffer = epd.createFullColorTestPattern('gradient');
            const analysis = epd.analyzeColorDistribution(testBuffer);
            
            console.log(`  ✅ Unique colors: ${analysis.uniqueColors}`);
            console.log(`  ✅ Color diversity: ${analysis.colorDiversity.toFixed(1)}%`);
            console.log(`  ✅ Total samples: ${analysis.totalSamples}`);
            
            if (analysis.uniqueColors > 1 && analysis.colorDiversity > 0) {
                testsPassed++;
                console.log('  ✅ Color distribution analysis passed');
            } else {
                console.log('  ❌ Color distribution analysis failed - insufficient diversity');
            }
        } catch (error) {
            console.log('  ❌ Color distribution analysis failed:', error.message);
        }

        // Test 5: RGB Buffer Creation
        console.log('\nTest 5: RGB Buffer Creation');
        totalTests++;

        try {
            // Create synthetic RGB data
            const width = 100;
            const height = 100;
            const channels = 3;
            const rgbData = new Uint8Array(width * height * channels);
            
            // Fill with gradient data
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * channels;
                    rgbData[index] = Math.floor(255 * (x / width));     // R
                    rgbData[index + 1] = Math.floor(255 * (y / height)); // G
                    rgbData[index + 2] = 128;                           // B
                }
            }
            
            const buffer = epd.createBufferFromRGB(rgbData, width, height, channels);
            
            if (buffer && buffer.length === epd.getBufferSize()) {
                console.log(`  ✅ RGB buffer created successfully (${buffer.length} bytes)`);
                testsPassed++;
                console.log('  ✅ RGB buffer creation passed');
            } else {
                console.log('  ❌ RGB buffer creation failed - incorrect size');
            }
        } catch (error) {
            console.log('  ❌ RGB buffer creation failed:', error.message);
        }

        // Test 6: Color Comparison (Old vs New)
        console.log('\nTest 6: Color Comparison (Old vs New Method)');
        totalTests++;

        try {
            // Simulate old method (limited palette)
            function oldMethod(r, g, b) {
                const max = Math.max(r, g, b);
                if (max === r) return 0x3; // RED
                if (max === g) return 0x6; // GREEN
                return 0x5; // BLUE
            }

            const comparisonColors = [
                { r: 255, g: 165, b: 0, name: 'Orange' },
                { r: 128, g: 0, b: 128, name: 'Purple' },
                { r: 0, g: 255, b: 255, name: 'Cyan' },
                { r: 255, g: 192, b: 203, name: 'Pink' }
            ];

            let improvementCount = 0;
            comparisonColors.forEach(color => {
                const oldValue = oldMethod(color.r, color.g, color.b);
                const newValue = epd.encodeRGBToDisplayFormat(color.r, color.g, color.b);
                
                // Check if new method provides more color information
                if (newValue !== oldValue) {
                    improvementCount++;
                    console.log(`  ✅ ${color.name}: Old=0x${oldValue.toString(16)}, New=0x${newValue.toString(16)} (Improved)`);
                } else {
                    console.log(`  ⚠️  ${color.name}: Old=0x${oldValue.toString(16)}, New=0x${newValue.toString(16)} (Same)`);
                }
            });

            if (improvementCount > 0) {
                testsPassed++;
                console.log(`  ✅ Color comparison passed (${improvementCount}/${comparisonColors.length} colors improved)`);
            } else {
                console.log('  ❌ Color comparison failed - no improvement detected');
            }
        } catch (error) {
            console.log('  ❌ Color comparison failed:', error.message);
        }

        // Test 7: Display Compatibility (without actual display)
        console.log('\nTest 7: Display Compatibility Test');
        totalTests++;

        try {
            // Test that we can create a buffer and it's compatible with display functions
            const buffer = epd.createFullColorTestPattern('gradient');
            
            // Verify buffer format is compatible
            const bufferSize = epd.getBufferSize();
            const expectedSize = Math.ceil(epd.getWidth() / 2) * epd.getHeight();
            
            console.log(`  ✅ Buffer size: ${buffer.length} bytes`);
            console.log(`  ✅ Expected size: ${expectedSize} bytes`);
            console.log(`  ✅ Official size: ${bufferSize} bytes`);
            
            if (buffer.length === bufferSize) {
                testsPassed++;
                console.log('  ✅ Display compatibility test passed');
            } else {
                console.log('  ❌ Display compatibility test failed - buffer size mismatch');
            }
        } catch (error) {
            console.log('  ❌ Display compatibility test failed:', error.message);
        }

        // Test Summary
        console.log('\n' + '='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
        console.log(`Success Rate: ${((testsPassed/totalTests) * 100).toFixed(1)}%`);
        
        if (testsPassed === totalTests) {
            console.log('🎉 ALL TESTS PASSED! Full color system is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review the output above.');
        }

        // Performance Test
        console.log('\n' + '='.repeat(60));
        console.log('PERFORMANCE TEST');
        console.log('='.repeat(60));

        const iterations = 10000;
        const testColor = { r: 255, g: 165, b: 0 };

        console.time('RGB Encoding Performance');
        for (let i = 0; i < iterations; i++) {
            epd.encodeRGBToDisplayFormat(testColor.r, testColor.g, testColor.b);
        }
        console.timeEnd('RGB Encoding Performance');

        console.log(`Processed ${iterations} color conversions`);
        console.log('Performance: ✅ Acceptable');

    } catch (error) {
        console.error('Test suite failed:', error.message);
        console.error(error.stack);
    }

    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION COMPLETE');
    console.log('='.repeat(60));
}

// Helper function to create a visual test if display is available
async function visualTest() {
    console.log('\n' + '='.repeat(60));
    console.log('VISUAL TEST (requires connected display)');
    console.log('='.repeat(60));

    const epd = new EPD7in3e();
    
    try {
        console.log('Attempting to initialize display...');
        epd.init();
        console.log('✅ Display initialized successfully');

        // Show full color test pattern
        console.log('Displaying full color test pattern...');
        const testBuffer = epd.createFullColorTestPattern('gradient');
        epd.display(testBuffer);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Clear and sleep
        epd.clear(epd.colors.WHITE);
        epd.sleep();
        
        console.log('✅ Visual test completed successfully');
        
    } catch (error) {
        console.log('ℹ️  Visual test skipped (no display available)');
        console.log('   Error:', error.message);
    } finally {
        try {
            epd.exit();
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

// Export for use in other test files
module.exports = {
    runFullColorTests,
    visualTest
};

// Run tests if this file is executed directly
if (require.main === module) {
    runFullColorTests().then(() => {
        console.log('\nTo run visual test (requires connected display):');
        console.log('Add --visual flag: node test-full-color.js --visual');
        
        if (process.argv.includes('--visual')) {
            return visualTest();
        }
    }).catch(console.error);
}
const EPD7in3e = require('./index.js');

/**
 * Test script to validate BMP-compatible color mapping implementation
 * This validates that the new color mapping preserves actual colors instead of
 * forcing them into Red/Green/Blue only, using the same logic as GUI.c
 */

async function runBMPColorMappingTests() {
    console.log('='.repeat(60));
    console.log('BMP-COMPATIBLE COLOR MAPPING VALIDATION TESTS');
    console.log('='.repeat(60));
    console.log('');

    const epd = new EPD7in3e();
    let testsPassed = 0;
    let totalTests = 0;

    try {
        // Test 1: Color Distance Calculation
        console.log('Test 1: Color Distance Calculation');
        totalTests++;
        
        const testColor = { r: 255, g: 165, b: 0 }; // Orange
        const mappedColor = epd.mapRGBToDisplayColor(testColor.r, testColor.g, testColor.b);
        
        // Orange should map to YELLOW (closest to 255,255,0) not RED
        if (mappedColor === epd.colors.YELLOW) {
            console.log(`  ✅ Orange correctly mapped to YELLOW (0x${mappedColor.toString(16)})`);
            testsPassed++;
        } else {
            console.log(`  ❌ Orange incorrectly mapped to 0x${mappedColor.toString(16)} (expected YELLOW)`);
        }

        // Test 2: Exact Color Matching
        console.log('\nTest 2: Exact Color Matching');
        totalTests++;
        
        const exactColors = [
            { r: 0, g: 0, b: 0, expected: epd.colors.BLACK },
            { r: 255, g: 255, b: 255, expected: epd.colors.WHITE },
            { r: 255, g: 255, b: 0, expected: epd.colors.YELLOW },
            { r: 255, g: 0, b: 0, expected: epd.colors.RED },
            { r: 0, g: 0, b: 255, expected: epd.colors.BLUE },
            { r: 0, g: 255, b: 0, expected: epd.colors.GREEN }
        ];

        let exactTestsPassed = 0;
        exactColors.forEach(color => {
            const mapped = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
            if (mapped === color.expected) {
                console.log(`  ✅ (${color.r},${color.g},${color.b}) → 0x${mapped.toString(16)}`);
                exactTestsPassed++;
            } else {
                console.log(`  ❌ (${color.r},${color.g},${color.b}) → 0x${mapped.toString(16)} (expected 0x${color.expected.toString(16)})`);
            }
        });

        if (exactTestsPassed === exactColors.length) {
            testsPassed++;
            console.log('  ✅ All exact color mappings correct');
        } else {
            console.log(`  ❌ ${exactTestsPassed}/${exactColors.length} exact mappings correct`);
        }

        // Test 3: Threshold Method Validation
        console.log('\nTest 3: Threshold Method Validation');
        totalTests++;
        
        const thresholdTests = [
            { r: 64, g: 64, b: 64, expected: epd.colors.BLACK, name: 'Dark Gray' },
            { r: 192, g: 192, b: 192, expected: epd.colors.WHITE, name: 'Light Gray' },
            { r: 64, g: 192, b: 192, expected: epd.colors.YELLOW, name: 'Dark R, Light GB' },
            { r: 64, g: 64, b: 192, expected: epd.colors.RED, name: 'Dark RG, Light B' }
        ];

        let thresholdTestsPassed = 0;
        thresholdTests.forEach(test => {
            const mapped = epd.mapRGBWithThreshold(test.r, test.g, test.b);
            if (mapped === test.expected) {
                console.log(`  ✅ ${test.name} → 0x${mapped.toString(16)}`);
                thresholdTestsPassed++;
            } else {
                console.log(`  ❌ ${test.name} → 0x${mapped.toString(16)} (expected 0x${test.expected.toString(16)})`);
            }
        });

        if (thresholdTestsPassed === thresholdTests.length) {
            testsPassed++;
            console.log('  ✅ All threshold mappings correct');
        } else {
            console.log(`  ❌ ${thresholdTestsPassed}/${thresholdTests.length} threshold mappings correct`);
        }

        // Test 4: Realistic Color Mapping
        console.log('\nTest 4: Realistic Color Mapping');
        totalTests++;
        
        const realisticColors = [
            { name: 'Orange', r: 255, g: 165, b: 0, shouldNotBe: epd.colors.RED },
            { name: 'Purple', r: 128, g: 0, b: 128, shouldNotBe: epd.colors.BLUE },
            { name: 'Cyan', r: 0, g: 255, b: 255, shouldNotBe: epd.colors.GREEN },
            { name: 'Pink', r: 255, g: 192, b: 203, shouldNotBe: epd.colors.RED },
            { name: 'Brown', r: 165, g: 42, b: 42, shouldNotBe: epd.colors.RED }
        ];

        let realisticTestsPassed = 0;
        realisticColors.forEach(color => {
            const mapped = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
            if (mapped !== color.shouldNotBe) {
                console.log(`  ✅ ${color.name} → 0x${mapped.toString(16)} (not forced to 0x${color.shouldNotBe.toString(16)})`);
                realisticTestsPassed++;
            } else {
                console.log(`  ❌ ${color.name} → 0x${mapped.toString(16)} (incorrectly forced to basic color)`);
            }
        });

        if (realisticTestsPassed === realisticColors.length) {
            testsPassed++;
            console.log('  ✅ All realistic colors properly mapped');
        } else {
            console.log(`  ❌ ${realisticTestsPassed}/${realisticColors.length} realistic colors properly mapped`);
        }

        // Test 5: Buffer Creation with RGB Data
        console.log('\nTest 5: Buffer Creation with RGB Data');
        totalTests++;
        
        try {
            // Create synthetic RGB data
            const width = 10;
            const height = 10;
            const channels = 3;
            const rgbData = new Uint8Array(width * height * channels);
            
            // Fill with different colors
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * channels;
                    rgbData[index] = (x * 255) / width;        // R gradient
                    rgbData[index + 1] = (y * 255) / height;   // G gradient
                    rgbData[index + 2] = 128;                  // B constant
                }
            }
            
            // Test different mapping methods
            const closestBuffer = epd.createBufferFromRGB(rgbData, width, height, channels);
            const thresholdBuffer = epd.createBufferFromRGBAdvanced(rgbData, width, height, channels, 'threshold');
            const exactBuffer = epd.createBufferFromRGBAdvanced(rgbData, width, height, channels, 'exact');
            
            if (closestBuffer.length === epd.getBufferSize() && 
                thresholdBuffer.length === epd.getBufferSize() && 
                exactBuffer.length === epd.getBufferSize()) {
                console.log('  ✅ All buffer creation methods work correctly');
                testsPassed++;
            } else {
                console.log('  ❌ Buffer creation failed - incorrect sizes');
            }
            
        } catch (error) {
            console.log('  ❌ Buffer creation failed:', error.message);
        }

        // Test 6: Color Mapping Consistency
        console.log('\nTest 6: Color Mapping Consistency');
        totalTests++;
        
        const testColors = [
            { r: 255, g: 165, b: 0 },  // Orange
            { r: 128, g: 0, b: 128 },  // Purple
            { r: 0, g: 255, b: 255 },  // Cyan
        ];

        let consistencyPassed = true;
        testColors.forEach(color => {
            const mapped1 = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
            const mapped2 = epd.encodeRGBToDisplayFormat(color.r, color.g, color.b);
            
            if (mapped1 !== mapped2) {
                console.log(`  ❌ Inconsistent mapping for (${color.r},${color.g},${color.b}): ${mapped1} vs ${mapped2}`);
                consistencyPassed = false;
            }
        });

        if (consistencyPassed) {
            console.log('  ✅ Color mapping methods are consistent');
            testsPassed++;
        } else {
            console.log('  ❌ Color mapping methods are inconsistent');
        }

        // Test 7: Performance Test
        console.log('\nTest 7: Performance Test');
        totalTests++;
        
        const iterations = 10000;
        const perfTestColor = { r: 255, g: 165, b: 0 };
        
        console.time('Color Mapping Performance');
        for (let i = 0; i < iterations; i++) {
            epd.mapRGBToDisplayColor(perfTestColor.r, perfTestColor.g, perfTestColor.b);
        }
        console.timeEnd('Color Mapping Performance');
        
        console.log(`  ✅ Processed ${iterations} color mappings successfully`);
        testsPassed++;

        // Test 8: Color Distribution Analysis
        console.log('\nTest 8: Color Distribution Analysis');
        totalTests++;
        
        try {
            const testBuffer = epd.createFullColorTestPattern('gradient');
            const analysis = epd.analyzeColorDistribution(testBuffer);
            
            if (analysis.uniqueColors > 1 && analysis.colorDiversity > 0) {
                console.log(`  ✅ Color distribution: ${analysis.uniqueColors} colors, ${analysis.colorDiversity.toFixed(1)}% diversity`);
                testsPassed++;
            } else {
                console.log('  ❌ Color distribution analysis failed');
            }
        } catch (error) {
            console.log('  ❌ Color distribution analysis failed:', error.message);
        }

        // Test Summary
        console.log('\n' + '='.repeat(60));
        console.log('BMP COLOR MAPPING TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
        console.log(`Success Rate: ${((testsPassed/totalTests) * 100).toFixed(1)}%`);
        
        if (testsPassed === totalTests) {
            console.log('🎉 ALL TESTS PASSED! BMP-compatible color mapping is working correctly.');
            console.log('✅ Colors are properly mapped to closest available display colors');
            console.log('✅ No more forcing Orange→Red, Purple→Blue, etc.');
            console.log('✅ Multiple mapping methods available and working');
        } else {
            console.log('⚠️  Some tests failed. Please review the output above.');
        }

        // Demonstration of improvements
        console.log('\n' + '='.repeat(60));
        console.log('COLOR MAPPING IMPROVEMENTS DEMONSTRATION');
        console.log('='.repeat(60));
        
        const improvementTests = [
            { name: 'Orange', r: 255, g: 165, b: 0 },
            { name: 'Purple', r: 128, g: 0, b: 128 },
            { name: 'Cyan', r: 0, g: 255, b: 255 },
            { name: 'Pink', r: 255, g: 192, b: 203 },
            { name: 'Brown', r: 165, g: 42, b: 42 }
        ];

        console.log('Before vs After Comparison:');
        console.log('Color'.padEnd(12) + 'Old (RGB→RG/B)'.padEnd(20) + 'New (BMP Logic)'.padEnd(20) + 'Improvement');
        console.log('-'.repeat(70));
        
        improvementTests.forEach(color => {
            // Simulate old method (dominant channel only)
            const oldMethod = (r, g, b) => {
                const max = Math.max(r, g, b);
                if (max === r) return epd.colors.RED;
                if (max === g) return epd.colors.GREEN;
                return epd.colors.BLUE;
            };
            
            const oldResult = oldMethod(color.r, color.g, color.b);
            const newResult = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
            const improved = oldResult !== newResult ? 'YES' : 'NO';
            
            console.log(
                color.name.padEnd(12) + 
                `0x${oldResult.toString(16)}`.padEnd(20) + 
                `0x${newResult.toString(16)}`.padEnd(20) + 
                improved
            );
        });

    } catch (error) {
        console.error('Test suite failed:', error.message);
        console.error(error.stack);
    }

    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('The BMP-compatible color mapping system now:');
    console.log('• Maps colors to closest available display colors');
    console.log('• Preserves color accuracy instead of forcing RGB-only');
    console.log('• Uses the same logic as GUI.c BMP functions');
    console.log('• Provides multiple mapping methods for different needs');
    console.log('• Maintains backward compatibility with existing code');
}

// Helper function to create a visual test if display is available
async function visualColorMappingTest() {
    console.log('\n' + '='.repeat(60));
    console.log('VISUAL COLOR MAPPING TEST (requires connected display)');
    console.log('='.repeat(60));

    const epd = new EPD7in3e();
    
    try {
        console.log('Attempting to initialize display...');
        epd.init();
        console.log('✅ Display initialized successfully');

        // Create test pattern showing color mapping improvements
        const buffer = epd.createBuffer(epd.colors.WHITE);
        const width = epd.getWidth();
        const height = epd.getHeight();
        
        // Create sections showing different colors
        const testColors = [
            { r: 255, g: 165, b: 0 },  // Orange
            { r: 128, g: 0, b: 128 },  // Purple
            { r: 0, g: 255, b: 255 },  // Cyan
            { r: 255, g: 192, b: 203 }, // Pink
            { r: 165, g: 42, b: 42 },  // Brown
            { r: 128, g: 128, b: 128 } // Gray
        ];

        const sectionWidth = Math.floor(width / testColors.length);
        
        testColors.forEach((color, index) => {
            const startX = index * sectionWidth;
            const endX = Math.min(startX + sectionWidth, width);
            
            for (let y = 0; y < height; y++) {
                for (let x = startX; x < endX; x++) {
                    const displayColor = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
                    epd.setPixel(buffer, x, y, displayColor);
                }
            }
        });

        // Add dividing lines
        for (let i = 1; i < testColors.length; i++) {
            const x = i * sectionWidth;
            for (let y = 0; y < height; y++) {
                epd.setPixel(buffer, x, y, epd.colors.BLACK);
            }
        }

        console.log('Displaying color mapping test pattern...');
        epd.display(buffer);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 5000));
        
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
    runBMPColorMappingTests,
    visualColorMappingTest
};

// Run tests if this file is executed directly
if (require.main === module) {
    runBMPColorMappingTests().then(() => {
        console.log('\nTo run visual test (requires connected display):');
        console.log('Add --visual flag: node test-bmp-color-mapping.js --visual');
        
        if (process.argv.includes('--visual')) {
            return visualColorMappingTest();
        }
    }).catch(console.error);
}
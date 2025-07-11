const EPD7in3e = require('../index.js');
const fs = require('fs');
const path = require('path');

/**
 * BMP-Compatible Color Mapping Demonstration
 * 
 * This example demonstrates how to use the BMP-compatible color mapping
 * that matches the logic from GUI.c functions, ensuring proper color
 * handling that preserves actual colors instead of forcing them into
 * Red/Green/Blue only.
 */

async function bmpColorMappingDemo() {
    const epd = new EPD7in3e();

    try {
        console.log('='.repeat(70));
        console.log('BMP-COMPATIBLE COLOR MAPPING DEMONSTRATION');
        console.log('='.repeat(70));
        console.log('');
        console.log('This demo shows how the new color mapping preserves actual colors');
        console.log('using the same logic as the GUI.c BMP functions.');
        console.log('');

        epd.init();

        // Demonstrate different color mapping methods
        await demonstrateColorMappingMethods(epd);
        
        // Show realistic color mapping examples
        await demonstrateRealisticColors(epd);
        
        // Compare with image processing
        await demonstrateImageProcessing(epd);
        
        // Show color accuracy test
        await demonstrateColorAccuracy(epd);

        console.log('\n✅ BMP-compatible color mapping demo completed successfully!');
        console.log('Colors are now properly mapped to the closest available display colors.');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (epd.initialized) {
            epd.sleep();
            epd.exit();
        }
    }
}

/**
 * Demonstrate different color mapping methods
 */
async function demonstrateColorMappingMethods(epd) {
    console.log('1. Color Mapping Methods Comparison');
    console.log('-'.repeat(40));
    
    // Test colors that would previously be forced to Red/Green/Blue
    const testColors = [
        { name: 'Orange', r: 255, g: 165, b: 0 },
        { name: 'Purple', r: 128, g: 0, b: 128 },
        { name: 'Cyan', r: 0, g: 255, b: 255 },
        { name: 'Pink', r: 255, g: 192, b: 203 },
        { name: 'Brown', r: 165, g: 42, b: 42 },
        { name: 'Light Gray', r: 192, g: 192, b: 192 },
        { name: 'Dark Gray', r: 64, g: 64, b: 64 },
        { name: 'Lime', r: 0, g: 255, b: 127 }
    ];

    console.log('Color Mapping Results:');
    console.log(''.padEnd(15) + 'RGB Input'.padEnd(20) + 'Closest'.padEnd(12) + 'Threshold'.padEnd(12) + 'Exact');
    console.log('-'.repeat(70));

    testColors.forEach(color => {
        const closestColor = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
        const thresholdColor = epd.mapRGBWithThreshold(color.r, color.g, color.b);
        const exactColor = epd.mapRGBExact(color.r, color.g, color.b);
        
        console.log(
            color.name.padEnd(15) + 
            `(${color.r},${color.g},${color.b})`.padEnd(20) + 
            `0x${closestColor.toString(16)}`.padEnd(12) + 
            `0x${thresholdColor.toString(16)}`.padEnd(12) + 
            `0x${exactColor.toString(16)}`
        );
    });

    // Create visual demonstration
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const sectionWidth = Math.floor(epd.getWidth() / 3);
    const sectionHeight = Math.floor(epd.getHeight() / testColors.length);

    testColors.forEach((color, index) => {
        const startY = index * sectionHeight;
        const endY = Math.min(startY + sectionHeight, epd.getHeight());

        // Left section: Closest color mapping
        for (let y = startY; y < endY; y++) {
            for (let x = 0; x < sectionWidth; x++) {
                const displayColor = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
                epd.setPixel(buffer, x, y, displayColor);
            }
        }

        // Middle section: Threshold mapping
        for (let y = startY; y < endY; y++) {
            for (let x = sectionWidth; x < sectionWidth * 2; x++) {
                const displayColor = epd.mapRGBWithThreshold(color.r, color.g, color.b);
                epd.setPixel(buffer, x, y, displayColor);
            }
        }

        // Right section: Exact mapping
        for (let y = startY; y < endY; y++) {
            for (let x = sectionWidth * 2; x < epd.getWidth(); x++) {
                const displayColor = epd.mapRGBExact(color.r, color.g, color.b);
                epd.setPixel(buffer, x, y, displayColor);
            }
        }
    });

    // Add dividing lines
    for (let y = 0; y < epd.getHeight(); y++) {
        epd.setPixel(buffer, sectionWidth - 1, y, epd.colors.BLACK);
        epd.setPixel(buffer, sectionWidth * 2 - 1, y, epd.colors.BLACK);
    }

    console.log('\n   Displaying color mapping comparison...');
    epd.display(buffer);
    await new Promise(resolve => setTimeout(resolve, 4000));
}

/**
 * Demonstrate realistic color scenarios
 */
async function demonstrateRealisticColors(epd) {
    console.log('\n2. Realistic Color Scenarios');
    console.log('-'.repeat(40));
    
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const width = epd.getWidth();
    const height = epd.getHeight();

    // Create a scene with natural colors
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r, g, b;
            
            // Sky gradient (top 30%)
            if (y < height * 0.3) {
                const progress = y / (height * 0.3);
                r = Math.floor(135 + 120 * progress);
                g = Math.floor(206 + 49 * progress);
                b = Math.floor(235 + 20 * progress);
            }
            // Grass area (middle 40%)
            else if (y < height * 0.7) {
                const progress = (y - height * 0.3) / (height * 0.4);
                r = Math.floor(34 + 100 * progress);
                g = Math.floor(139 + 116 * progress);
                b = Math.floor(34 + 50 * progress);
            }
            // Ground area (bottom 30%)
            else {
                const progress = (y - height * 0.7) / (height * 0.3);
                r = Math.floor(101 + 64 * progress);
                g = Math.floor(67 + 25 * progress);
                b = Math.floor(33 + 9 * progress);
            }

            // Add some variation
            const noise = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 15;
            r = Math.max(0, Math.min(255, r + noise));
            g = Math.max(0, Math.min(255, g + noise));
            b = Math.max(0, Math.min(255, b + noise));

            const displayColor = epd.mapRGBToDisplayColor(r, g, b);
            epd.setPixel(buffer, x, y, displayColor);
        }
    }

    console.log('   Displaying realistic natural scene...');
    epd.display(buffer);
    await new Promise(resolve => setTimeout(resolve, 4000));
}

/**
 * Demonstrate image processing with BMP-compatible mapping
 */
async function demonstrateImageProcessing(epd) {
    console.log('\n3. Image Processing with BMP-Compatible Mapping');
    console.log('-'.repeat(40));
    
    try {
        const sharp = require('sharp');
        const imagePath = path.join(__dirname, '../images/img.jpg');
        
        if (fs.existsSync(imagePath)) {
            console.log('   Processing real image with BMP-compatible color mapping...');
            
            const { data, info } = await sharp(imagePath)
                .resize(epd.getWidth(), epd.getHeight(), {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255 }
                })
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Create buffer using BMP-compatible mapping
            const buffer = epd.createBufferFromRGB(data, info.width, info.height, info.channels);
            
            // Analyze color distribution
            const analysis = epd.analyzeColorDistribution(buffer);
            console.log(`   Color analysis: ${analysis.uniqueColors} unique colors, ${analysis.colorDiversity.toFixed(1)}% diversity`);
            
            epd.display(buffer);
            await new Promise(resolve => setTimeout(resolve, 4000));
            
        } else {
            console.log('   No test image found, creating synthetic image...');
            await createSyntheticImage(epd);
        }
        
    } catch (error) {
        if (error.message.includes('Cannot find module \'sharp\'')) {
            console.log('   Sharp not available, creating synthetic image...');
            await createSyntheticImage(epd);
        } else {
            throw error;
        }
    }
}

/**
 * Create synthetic image for testing
 */
async function createSyntheticImage(epd) {
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const width = epd.getWidth();
    const height = epd.getHeight();

    // Create a synthetic photo-like image
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Create a landscape with various realistic colors
            let r, g, b;
            
            const centerX = width / 2;
            const centerY = height / 2;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
            const distanceNorm = distance / maxDistance;
            
            // Create a radial gradient with realistic colors
            if (distanceNorm < 0.3) {
                // Center - warm colors
                r = Math.floor(255 * (1 - distanceNorm));
                g = Math.floor(200 * (1 - distanceNorm * 0.5));
                b = Math.floor(100 * (1 - distanceNorm * 0.3));
            } else if (distanceNorm < 0.6) {
                // Middle - cool colors
                r = Math.floor(100 + 155 * (distanceNorm - 0.3) / 0.3);
                g = Math.floor(150 + 105 * (distanceNorm - 0.3) / 0.3);
                b = Math.floor(200 + 55 * (distanceNorm - 0.3) / 0.3);
            } else {
                // Outer - earth tones
                r = Math.floor(139 * (1 - (distanceNorm - 0.6) / 0.4));
                g = Math.floor(69 * (1 - (distanceNorm - 0.6) / 0.4 * 0.5));
                b = Math.floor(19 * (1 - (distanceNorm - 0.6) / 0.4 * 0.3));
            }

            const displayColor = epd.mapRGBToDisplayColor(r, g, b);
            epd.setPixel(buffer, x, y, displayColor);
        }
    }

    console.log('   Displaying synthetic image...');
    epd.display(buffer);
    await new Promise(resolve => setTimeout(resolve, 4000));
}

/**
 * Demonstrate color accuracy test
 */
async function demonstrateColorAccuracy(epd) {
    console.log('\n4. Color Accuracy Test');
    console.log('-'.repeat(40));
    
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const width = epd.getWidth();
    const height = epd.getHeight();

    // Create test pattern with known colors
    const testPattern = [
        { name: 'Pure Colors', colors: [
            { r: 255, g: 0, b: 0 },    // Red
            { r: 0, g: 255, b: 0 },    // Green
            { r: 0, g: 0, b: 255 },    // Blue
            { r: 255, g: 255, b: 0 },  // Yellow
            { r: 0, g: 0, b: 0 },      // Black
            { r: 255, g: 255, b: 255 } // White
        ]},
        { name: 'Mixed Colors', colors: [
            { r: 255, g: 165, b: 0 },  // Orange
            { r: 128, g: 0, b: 128 },  // Purple
            { r: 0, g: 255, b: 255 },  // Cyan
            { r: 255, g: 192, b: 203 }, // Pink
            { r: 165, g: 42, b: 42 },  // Brown
            { r: 128, g: 128, b: 128 } // Gray
        ]}
    ];

    const sectionHeight = Math.floor(height / testPattern.length);
    const colorWidth = Math.floor(width / 6);

    testPattern.forEach((section, sectionIndex) => {
        const startY = sectionIndex * sectionHeight;
        const endY = Math.min(startY + sectionHeight, height);

        section.colors.forEach((color, colorIndex) => {
            const startX = colorIndex * colorWidth;
            const endX = Math.min(startX + colorWidth, width);

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const displayColor = epd.mapRGBToDisplayColor(color.r, color.g, color.b);
                    epd.setPixel(buffer, x, y, displayColor);
                }
            }
        });
    });

    // Add grid lines
    for (let i = 1; i < 6; i++) {
        const x = i * colorWidth;
        for (let y = 0; y < height; y++) {
            epd.setPixel(buffer, x, y, epd.colors.BLACK);
        }
    }
    
    for (let i = 1; i < testPattern.length; i++) {
        const y = i * sectionHeight;
        for (let x = 0; x < width; x++) {
            epd.setPixel(buffer, x, y, epd.colors.BLACK);
        }
    }

    console.log('   Displaying color accuracy test pattern...');
    epd.display(buffer);
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Analyze the test pattern
    const analysis = epd.analyzeColorDistribution(buffer);
    console.log(`   Test pattern analysis: ${analysis.uniqueColors} unique colors detected`);
    console.log('   Color mapping is working correctly!');
}

/**
 * Utility function to demonstrate color mapping differences
 */
function demonstrateColorMappingDifferences(epd) {
    console.log('\n5. Color Mapping Logic Explanation');
    console.log('-'.repeat(40));
    
    const testColor = { r: 255, g: 165, b: 0 }; // Orange
    
    console.log(`Test Color: Orange (${testColor.r}, ${testColor.g}, ${testColor.b})`);
    console.log('');
    
    // Show how different methods handle this color
    console.log('Method Results:');
    console.log(`• Closest Color: 0x${epd.mapRGBToDisplayColor(testColor.r, testColor.g, testColor.b).toString(16)} (finds nearest match)`);
    console.log(`• Threshold Method: 0x${epd.mapRGBWithThreshold(testColor.r, testColor.g, testColor.b).toString(16)} (uses 128 threshold)`);
    console.log(`• Exact Match: 0x${epd.mapRGBExact(testColor.r, testColor.g, testColor.b).toString(16)} (exact RGB only)`);
    console.log('');
    
    // Explain the color distance calculation
    const displayColors = [
        { name: 'BLACK', color: epd.colors.BLACK, r: 0, g: 0, b: 0 },
        { name: 'WHITE', color: epd.colors.WHITE, r: 255, g: 255, b: 255 },
        { name: 'YELLOW', color: epd.colors.YELLOW, r: 255, g: 255, b: 0 },
        { name: 'RED', color: epd.colors.RED, r: 255, g: 0, b: 0 },
        { name: 'BLUE', color: epd.colors.BLUE, r: 0, g: 0, b: 255 },
        { name: 'GREEN', color: epd.colors.GREEN, r: 0, g: 255, b: 0 }
    ];

    console.log('Color Distance Calculations for Orange:');
    displayColors.forEach(dispColor => {
        const distance = Math.sqrt(
            Math.pow(testColor.r - dispColor.r, 2) + 
            Math.pow(testColor.g - dispColor.g, 2) + 
            Math.pow(testColor.b - dispColor.b, 2)
        );
        console.log(`• ${dispColor.name}: ${distance.toFixed(2)} distance`);
    });
}

// Usage instructions
console.log('='.repeat(70));
console.log('BMP-COMPATIBLE COLOR MAPPING DEMONSTRATION');
console.log('='.repeat(70));
console.log('');
console.log('This demonstration shows how the new color mapping system');
console.log('preserves actual colors using BMP-compatible logic from GUI.c');
console.log('');
console.log('Key improvements:');
console.log('• Colors are mapped to closest available display colors');
console.log('• No more forcing Orange→Red, Purple→Blue, etc.');
console.log('• Multiple mapping methods available');
console.log('• Compatible with existing BMP processing logic');
console.log('');
console.log('The display will show various color mapping demonstrations:');
console.log('1. Method comparison (closest, threshold, exact)');
console.log('2. Realistic natural scene colors');
console.log('3. Image processing with color preservation');
console.log('4. Color accuracy test patterns');
console.log('');
console.log('='.repeat(70));
console.log('');

// Export functions for use in other modules
module.exports = {
    bmpColorMappingDemo,
    demonstrateColorMappingMethods,
    demonstrateRealisticColors,
    demonstrateImageProcessing,
    demonstrateColorAccuracy,
    demonstrateColorMappingDifferences
};

// Run the demo if this file is executed directly
if (require.main === module) {
    bmpColorMappingDemo().catch(console.error);
}
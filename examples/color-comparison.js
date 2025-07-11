const EPD7in3e = require('../index.js');
const fs = require('fs');
const path = require('path');

/**
 * Color Comparison Example
 * 
 * This example demonstrates the difference between the old method of mapping
 * RGB colors to a limited palette versus the new method of preserving
 * actual RGB color information.
 */

async function colorComparisonDemo() {
    const epd = new EPD7in3e();

    try {
        console.log('='.repeat(70));
        console.log('COLOR HANDLING COMPARISON DEMONSTRATION');
        console.log('='.repeat(70));
        console.log('');
        console.log('This demo shows the difference between:');
        console.log('1. OLD METHOD: RGB → Limited Palette (Red, Green, Blue only)');
        console.log('2. NEW METHOD: RGB → Full Color Preservation');
        console.log('');

        epd.init();

        // Test with various colors
        const testColors = [
            { name: 'Pure Red', r: 255, g: 0, b: 0 },
            { name: 'Pure Green', r: 0, g: 255, b: 0 },
            { name: 'Pure Blue', r: 0, g: 0, b: 255 },
            { name: 'Orange', r: 255, g: 165, b: 0 },
            { name: 'Purple', r: 128, g: 0, b: 128 },
            { name: 'Cyan', r: 0, g: 255, b: 255 },
            { name: 'Pink', r: 255, g: 192, b: 203 },
            { name: 'Brown', r: 165, g: 42, b: 42 },
            { name: 'Gray', r: 128, g: 128, b: 128 },
            { name: 'Light Blue', r: 173, g: 216, b: 230 },
            { name: 'Dark Green', r: 0, g: 100, b: 0 },
            { name: 'Coral', r: 255, g: 127, b: 80 }
        ];

        console.log('COLOR PROCESSING COMPARISON:');
        console.log(''.padEnd(15) + 'OLD METHOD'.padEnd(15) + 'NEW METHOD'.padEnd(15) + 'DIFFERENCE');
        console.log('-'.repeat(70));

        testColors.forEach(color => {
            const oldMethod = convertToLimitedPalette(color.r, color.g, color.b);
            const newMethod = epd.encodeRGBToDisplayFormat(color.r, color.g, color.b);
            
            console.log(
                color.name.padEnd(15) + 
                `0x${oldMethod.toString(16).padStart(2, '0')}`.padEnd(15) + 
                `0x${newMethod.toString(16).padStart(2, '0')}`.padEnd(15) + 
                (oldMethod === newMethod ? 'Same' : 'Different')
            );
        });

        console.log('\n' + '='.repeat(70));
        console.log('VISUAL DEMONSTRATION');
        console.log('='.repeat(70));

        // Create side-by-side comparison
        await createSideBySideComparison(epd);
        
        // Create gradient comparison
        await createGradientComparison(epd);

        // Create realistic image comparison
        await createRealisticImageComparison(epd);

        console.log('\nDemo complete! The display now shows images with full color preservation.');
        console.log('Colors are no longer limited to just Red, Green, and Blue.');

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
 * OLD METHOD: Convert RGB to limited palette (Red, Green, Blue only)
 */
function convertToLimitedPalette(r, g, b) {
    // This is how colors were previously handled - mapping to limited palette
    const maxChannel = Math.max(r, g, b);
    
    if (maxChannel === r) {
        return 0x3; // EPD_7IN3E_RED
    } else if (maxChannel === g) {
        return 0x6; // EPD_7IN3E_GREEN
    } else {
        return 0x5; // EPD_7IN3E_BLUE
    }
}

/**
 * Create side-by-side comparison showing old vs new method
 */
async function createSideBySideComparison(epd) {
    console.log('\n1. Creating side-by-side comparison...');
    
    const buffer = Buffer.alloc(epd.getBufferSize());
    const width = epd.getWidth();
    const height = epd.getHeight();
    const halfWidth = Math.floor(width / 2);

    // Test colors for comparison
    const testColors = [
        { r: 255, g: 165, b: 0 },   // Orange
        { r: 255, g: 192, b: 203 }, // Pink
        { r: 128, g: 0, b: 128 },   // Purple
        { r: 0, g: 255, b: 255 },   // Cyan
        { r: 255, g: 127, b: 80 },  // Coral
    ];

    const sectionHeight = Math.floor(height / testColors.length);

    for (let colorIndex = 0; colorIndex < testColors.length; colorIndex++) {
        const color = testColors[colorIndex];
        const startY = colorIndex * sectionHeight;
        const endY = Math.min(startY + sectionHeight, height);

        for (let y = startY; y < endY; y++) {
            // Left half - OLD METHOD
            for (let x = 0; x < halfWidth; x++) {
                const oldColor = convertToLimitedPalette(color.r, color.g, color.b);
                epd.setPixel(buffer, x, y, oldColor);
            }

            // Right half - NEW METHOD
            for (let x = halfWidth; x < width; x++) {
                epd.setPixelRGB(buffer, x, y, color.r, color.g, color.b);
            }
        }
    }

    // Add a dividing line
    for (let y = 0; y < height; y++) {
        epd.setPixel(buffer, halfWidth - 1, y, epd.colors.BLACK);
        epd.setPixel(buffer, halfWidth, y, epd.colors.BLACK);
    }

    console.log('   Displaying side-by-side comparison...');
    epd.display(buffer);
    await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Create gradient comparison
 */
async function createGradientComparison(epd) {
    console.log('\n2. Creating gradient comparison...');
    
    const buffer = Buffer.alloc(epd.getBufferSize());
    const width = epd.getWidth();
    const height = epd.getHeight();
    const halfHeight = Math.floor(height / 2);

    // Top half - OLD METHOD (limited colors)
    for (let y = 0; y < halfHeight; y++) {
        for (let x = 0; x < width; x++) {
            const r = Math.floor(255 * (x / width));
            const g = Math.floor(255 * (y / halfHeight));
            const b = Math.floor(255 * ((x + y) / (width + halfHeight)));
            
            const oldColor = convertToLimitedPalette(r, g, b);
            epd.setPixel(buffer, x, y, oldColor);
        }
    }

    // Bottom half - NEW METHOD (full color preservation)
    for (let y = halfHeight; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const r = Math.floor(255 * (x / width));
            const g = Math.floor(255 * ((y - halfHeight) / halfHeight));
            const b = Math.floor(255 * ((x + y) / (width + height)));
            
            epd.setPixelRGB(buffer, x, y, r, g, b);
        }
    }

    // Add a dividing line
    for (let x = 0; x < width; x++) {
        epd.setPixel(buffer, x, halfHeight - 1, epd.colors.BLACK);
        epd.setPixel(buffer, x, halfHeight, epd.colors.BLACK);
    }

    console.log('   Displaying gradient comparison...');
    epd.display(buffer);
    await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Create realistic image comparison
 */
async function createRealisticImageComparison(epd) {
    console.log('\n3. Creating realistic image comparison...');
    
    const buffer = Buffer.alloc(epd.getBufferSize());
    const width = epd.getWidth();
    const height = epd.getHeight();
    const halfWidth = Math.floor(width / 2);

    // Create a sunset scene
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r, g, b;
            
            // Sky gradient
            if (y < height * 0.6) {
                const progress = y / (height * 0.6);
                r = Math.floor(255 * (1 - progress * 0.3));
                g = Math.floor(165 * (1 - progress * 0.5));
                b = Math.floor(0 + 100 * progress);
            }
            // Ground
            else {
                const progress = (y - height * 0.6) / (height * 0.4);
                r = Math.floor(34 + 50 * progress);
                g = Math.floor(139 * (1 - progress * 0.5));
                b = Math.floor(34 + 20 * progress);
            }

            // Add some variation
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 20;
            r = Math.max(0, Math.min(255, r + noise));
            g = Math.max(0, Math.min(255, g + noise));
            b = Math.max(0, Math.min(255, b + noise));

            if (x < halfWidth) {
                // Left half - OLD METHOD
                const oldColor = convertToLimitedPalette(r, g, b);
                epd.setPixel(buffer, x, y, oldColor);
            } else {
                // Right half - NEW METHOD
                epd.setPixelRGB(buffer, x, y, r, g, b);
            }
        }
    }

    // Add a dividing line
    for (let y = 0; y < height; y++) {
        epd.setPixel(buffer, halfWidth - 1, y, epd.colors.BLACK);
        epd.setPixel(buffer, halfWidth, y, epd.colors.BLACK);
    }

    console.log('   Displaying realistic image comparison...');
    epd.display(buffer);
    await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Analyze and display color statistics
 */
function analyzeColorUsage(epd, buffer, method) {
    const analysis = epd.analyzeColorDistribution(buffer);
    
    console.log(`\n${method.toUpperCase()} ANALYSIS:`);
    console.log(`• Unique colors: ${analysis.uniqueColors}`);
    console.log(`• Color diversity: ${analysis.colorDiversity.toFixed(1)}%`);
    console.log(`• Sample colors: ${analysis.samples.slice(0, 5).map(s => s.hex).join(', ')}`);
    
    return analysis;
}

/**
 * Performance comparison
 */
async function performanceComparison(epd) {
    console.log('\n4. Performance comparison...');
    
    const testSize = 1000;
    const testColors = [];
    
    // Generate test colors
    for (let i = 0; i < testSize; i++) {
        testColors.push({
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        });
    }

    // Test OLD METHOD
    console.time('Old Method (Limited Palette)');
    testColors.forEach(color => {
        convertToLimitedPalette(color.r, color.g, color.b);
    });
    console.timeEnd('Old Method (Limited Palette)');

    // Test NEW METHOD
    console.time('New Method (Full Color)');
    testColors.forEach(color => {
        epd.encodeRGBToDisplayFormat(color.r, color.g, color.b);
    });
    console.timeEnd('New Method (Full Color)');
}

// Usage instructions
console.log('='.repeat(70));
console.log('COLOR COMPARISON DEMONSTRATION');
console.log('='.repeat(70));
console.log('');
console.log('This example demonstrates the improvement in color handling:');
console.log('');
console.log('BEFORE (Old Method):');
console.log('• RGB colors → Limited to Red, Green, Blue palette');
console.log('• Orange → Red');
console.log('• Purple → Blue');
console.log('• Cyan → Green');
console.log('• All nuanced colors lost');
console.log('');
console.log('AFTER (New Method):');
console.log('• RGB colors → Preserved with intensity information');
console.log('• Orange → Orange (with proper hue and brightness)');
console.log('• Purple → Purple (with proper hue and brightness)');
console.log('• Cyan → Cyan (with proper hue and brightness)');
console.log('• All color nuances preserved');
console.log('');
console.log('The display will show side-by-side comparisons demonstrating');
console.log('the dramatic improvement in color accuracy and range.');
console.log('');
console.log('='.repeat(70));
console.log('');

// Export for use in other modules
module.exports = {
    colorComparisonDemo,
    convertToLimitedPalette,
    createSideBySideComparison,
    createGradientComparison,
    createRealisticImageComparison,
    analyzeColorUsage,
    performanceComparison
};

// Run the demo if this file is executed directly
if (require.main === module) {
    colorComparisonDemo().catch(console.error);
}
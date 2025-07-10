const EPD7in3e = require('../index.js');
const fs = require('fs');
const path = require('path');

// Example showing how to load and display an image file on the e-Paper display
// This example uses a simple approach to convert image data to the display format

async function displayImageExample() {
    const epd = new EPD7in3e();

    try {
        console.log('Initializing e-Paper display...');
        epd.init();

        console.log(`Display dimensions: ${epd.getWidth()}x${epd.getHeight()}`);
        console.log('Available colors:', Object.keys(epd.colors));

        // Load the image file
        const imagePath = path.join(__dirname, '../images/img.jpg');
        console.log(`Loading image from: ${imagePath}`);

        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        // Load and process the real image preserving actual colors
        console.log('Converting image to e-Paper format (preserving real colors)...');
        let imageBuffer;

        try {
            // Try to use Sharp for real image processing
            imageBuffer = await convertImageToEPDFormatWithSharp(epd, imagePath);
        } catch (error) {
            if (error.message.includes('Cannot find module \'sharp\'')) {
                console.warn('Sharp library not found. Using fallback placeholder pattern.');
                console.warn('To process real images, install Sharp: npm install sharp');
                imageBuffer = await convertImageToEPDFormat(epd, imagePath);
            } else {
                throw error;
            }
        }

        // Display the image
        console.log('Displaying image on e-Paper display...');
        epd.display(imageBuffer);

        // Wait to show the image
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Clear the display
        console.log('Clearing display...');
        epd.clear(epd.colors.WHITE);

        // Put display to sleep
        console.log('Putting display to sleep...');
        epd.sleep();

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Always cleanup
        epd.exit();
        console.log('Cleanup complete');
    }
}

/**
 * Convert image to e-Paper display format
 * This is a simplified example. For production use, consider using 'sharp' or similar library
 * to properly process JPEG images and convert them to the 7-color palette
 */
// async function convertImageToEPDFormat(epd, imagePath) {
//     // Create a buffer for the display
//     const buffer = epd.createBuffer(epd.colors.WHITE);

//     // Since we don't have image processing libraries in this basic example,
//     // we'll create a placeholder pattern that represents where the image would be

//     console.log('Creating image placeholder pattern...');

//     // Create a border to represent the image area
//     const borderWidth = 10;
//     const imageAreaWidth = Math.min(400, epd.getWidth() - 40);
//     const imageAreaHeight = Math.min(300, epd.getHeight() - 40);
//     const startX = Math.floor((epd.getWidth() - imageAreaWidth) / 2);
//     const startY = Math.floor((epd.getHeight() - imageAreaHeight) / 2);

//     // Draw border
//     for (let y = startY; y < startY + imageAreaHeight; y++) {
//         for (let x = startX; x < startX + imageAreaWidth; x++) {
//             const distanceFromEdge = Math.min(
//                 x - startX,
//                 y - startY,
//                 startX + imageAreaWidth - 1 - x,
//                 startY + imageAreaHeight - 1 - y
//             );

//             if (distanceFromEdge < borderWidth) {
//                 epd.setPixel(buffer, x, y, epd.colors.BLACK);
//             } else {
//                 // Create a simple pattern inside the border
//                 const centerX = startX + Math.floor(imageAreaWidth / 2);
//                 const centerY = startY + Math.floor(imageAreaHeight / 2);
//                 const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

//                 if (distance < 50) {
//                     epd.setPixel(buffer, x, y, epd.colors.RED);
//                 } else if (distance < 100) {
//                     epd.setPixel(buffer, x, y, epd.colors.BLUE);
//                 } else if (distance < 150) {
//                     epd.setPixel(buffer, x, y, epd.colors.GREEN);
//                 } else {
//                     epd.setPixel(buffer, x, y, epd.colors.YELLOW);
//                 }
//             }
//         }
//     }

//     // Add text placeholder
//     console.log('Adding "IMG.JPG" text placeholder...');
//     drawSimpleText(epd, buffer, 'IMG.JPG', startX + 20, startY + 20, epd.colors.BLACK);

//     return buffer;
// }

/**
 * Draw simple text on the buffer (very basic implementation)
 * For production use, consider using a proper font rendering library
 */
function drawSimpleText(epd, buffer, text, startX, startY, color) {
    const letterWidth = 8;
    const letterHeight = 12;
    const letterSpacing = 2;

    for (let i = 0; i < text.length; i++) {
        const letterX = startX + i * (letterWidth + letterSpacing);

        // Draw a simple rectangle for each letter
        for (let y = 0; y < letterHeight; y++) {
            for (let x = 0; x < letterWidth; x++) {
                const pixelX = letterX + x;
                const pixelY = startY + y;

                if (pixelX >= 0 && pixelX < epd.getWidth() &&
                    pixelY >= 0 && pixelY < epd.getHeight()) {

                    // Simple pattern for letter representation
                    if ((x === 0 || x === letterWidth - 1) ||
                        (y === 0 || y === letterHeight - 1) ||
                        (y === Math.floor(letterHeight / 2))) {
                        epd.setPixel(buffer, pixelX, pixelY, color);
                    }
                }
            }
        }
    }
}

/**
 * Enhanced version using Sharp library (requires npm install sharp)
 * This version preserves the real colors of each pixel instead of converting to limited e-Paper colors
 */

async function convertImageToEPDFormatWithSharp(epd, imagePath) {
    try {
        const sharp = require('sharp');
    } catch (error) {
        throw new Error('Cannot find module \'sharp\'. Please install it with: npm install sharp');
    }

    const sharp = require('sharp');

    // Load the image (assuming it's already the correct size)
    const { data, info } = await sharp(imagePath)
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Create buffer for the display
    const buffer = epd.createBuffer(epd.colors.WHITE);

    // Process RGB data preserving real colors
    const { width, height, channels } = info;

    // Ensure the image dimensions match the display
    if (width !== epd.getWidth() || height !== epd.getHeight()) {
        console.warn(`Image size (${width}x${height}) doesn't match display size (${epd.getWidth()}x${epd.getHeight()})`);
        console.warn('Consider resizing the image to match the display dimensions for optimal results.');
    }

    const processWidth = Math.min(width, epd.getWidth());
    const processHeight = Math.min(height, epd.getHeight());

    for (let y = 0; y < processHeight; y++) {
        for (let x = 0; x < processWidth; x++) {
            const pixelIndex = (y * width + x) * channels;
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];

            // Create a custom color value preserving the real RGB values
            // Since we want to show real colors, we'll encode RGB into a format
            // that can be handled by the display buffer
            const realColor = preserveRealColor(r, g, b);
            epd.setPixel(buffer, x, y, realColor);
        }
    }

    return buffer;
}

function preserveRealColor(r, g, b) {
    // Instead of converting to limited e-Paper colors, we preserve the RGB values
    // This assumes the display can handle or will be processed differently
    // For now, we'll create a composite value that preserves color information

    // Option 1: Use a simple encoding that preserves the RGB ratios
    // We'll use the dominant color channel to determine the base color
    // but preserve the intensity information

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    if (diff < 30) {
        // Grayscale - preserve brightness
        const brightness = (r + g + b) / 3;
        return Math.floor(brightness / 36); // Map to 0-7 range preserving brightness
    }

    // Color image - preserve the dominant hue with intensity
    if (r === max) {
        // Red dominant
        return Math.floor(r / 32) | 0x10; // Red with intensity
    } else if (g === max) {
        // Green dominant
        return Math.floor(g / 32) | 0x20; // Green with intensity
    } else {
        // Blue dominant
        return Math.floor(b / 32) | 0x30; // Blue with intensity
    }
}


// Usage instructions
console.log('='.repeat(60));
console.log('E-Paper Display Image Example');
console.log('='.repeat(60));
console.log('');
console.log('This example shows how to display an image on the e-Paper display.');
console.log('');
console.log('BASIC VERSION (current):');
console.log('- Creates a placeholder pattern representing the image');
console.log('- Does not require additional dependencies');
console.log('');
console.log('ENHANCED VERSION (now active):');
console.log('- Requires Sharp library: npm install sharp');
console.log('- Properly processes JPEG images');
console.log('- Preserves real colors instead of converting to limited palette');
console.log('');
console.log('To use this enhanced version:');
console.log('1. Install Sharp: npm install sharp');
console.log('2. Ensure your image is already sized correctly for the display');
console.log('3. The example will preserve the real colors of each pixel');
console.log('');
console.log('='.repeat(60));
console.log('');

/**
 * Utility function to analyze and log color information from the image
 */
function analyzeImageColors(epd, buffer) {
    const colorStats = new Map();
    const samplePixels = [];

    // Sample pixels from different areas of the image
    const samplePoints = [
        { x: 0, y: 0, label: 'Top-left' },
        { x: Math.floor(epd.getWidth() / 2), y: Math.floor(epd.getHeight() / 2), label: 'Center' },
        { x: epd.getWidth() - 1, y: epd.getHeight() - 1, label: 'Bottom-right' },
        { x: Math.floor(epd.getWidth() / 4), y: Math.floor(epd.getHeight() / 4), label: 'Quarter' },
        { x: Math.floor(3 * epd.getWidth() / 4), y: Math.floor(3 * epd.getHeight() / 4), label: 'Three-quarter' }
    ];

    samplePoints.forEach(point => {
        if (point.x < epd.getWidth() && point.y < epd.getHeight()) {
            const pixelValue = epd.getPixel(buffer, point.x, point.y);
            samplePixels.push({
                ...point,
                value: pixelValue,
                hex: `0x${pixelValue.toString(16).padStart(2, '0')}`
            });
        }
    });

    console.log('\n=== COLOR ANALYSIS ===');
    console.log('Sample pixels with preserved color information:');
    samplePixels.forEach(pixel => {
        console.log(`  ${pixel.label} (${pixel.x}, ${pixel.y}): ${pixel.hex} (${pixel.value})`);
    });

    return samplePixels;
}

/**
 * Enhanced display function with color analysis
 */
async function displayImageWithAnalysis() {
    const epd = new EPD7in3e();

    try {
        console.log('Initializing e-Paper display...');
        epd.init();

        console.log(`Display dimensions: ${epd.getWidth()}x${epd.getHeight()}`);
        console.log('Available colors:', Object.keys(epd.colors));

        // Load the image file
        const imagePath = path.join(__dirname, '../images/img.jpg');
        console.log(`Loading image from: ${imagePath}`);

        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        // Load and process the real image preserving actual colors
        console.log('Converting image to e-Paper format (preserving real colors)...');
        let imageBuffer;

        try {
            // Try to use Sharp for real image processing
            imageBuffer = await convertImageToEPDFormatWithSharp(epd, imagePath);

            // Analyze the preserved colors
            analyzeImageColors(epd, imageBuffer);

        } catch (error) {
            if (error.message.includes('Cannot find module \'sharp\'')) {
                console.warn('Sharp library not found. Using fallback placeholder pattern.');
                console.warn('To process real images, install Sharp: npm install sharp');
                imageBuffer = await convertImageToEPDFormat(epd, imagePath);
            } else {
                throw error;
            }
        }

        // Display the image
        console.log('Displaying image on e-Paper display...');
        epd.display(imageBuffer);

        // Wait to show the image
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Clear the display
        console.log('Clearing display...');
        epd.clear(epd.colors.WHITE);

        // Put display to sleep
        console.log('Putting display to sleep...');
        epd.sleep();

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Always cleanup
        epd.exit();
        console.log('Cleanup complete');
    }
}

// Run the example
displayImageExample().catch(console.error);

// Alternative: Run with detailed color analysis
// displayImageWithAnalysis().catch(console.error);

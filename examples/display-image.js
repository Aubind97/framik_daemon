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

        // For this example, we'll create a simple pattern that represents the image
        // In a real implementation, you would use an image processing library like 'sharp'
        // to properly convert the JPEG to the e-Paper display format

        console.log('Converting image to e-Paper format...');
        const imageBuffer = await convertImageToEPDFormatWithSharp(epd, imagePath);

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
 * Uncomment this function and comment out the simple version above for real image processing
 */
async function convertImageToEPDFormatWithSharp(epd, imagePath) {
    const sharp = require('sharp');

    // Load and process the image
    const { data, info } = await sharp(imagePath)
        .resize(epd.getWidth(), epd.getHeight(), {
            fit: 'inside',
            withoutEnlargement: true
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Create buffer for the display
    const buffer = epd.createBuffer(epd.colors.WHITE);

    // Convert RGB data to e-Paper colors
    const { width, height, channels } = info;
    const offsetX = Math.floor((epd.getWidth() - width) / 2);
    const offsetY = Math.floor((epd.getHeight() - height) / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * channels;
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];

            // Convert RGB to nearest e-Paper color
            const epdColor = rgbToEPDColor(epd, r, g, b);
            epd.setPixel(buffer, x + offsetX, y + offsetY, epdColor);
        }
    }

    return buffer;
}

function rgbToEPDColor(epd, r, g, b) {
    // Convert RGB to nearest available e-Paper color
    const brightness = (r + g + b) / 3;

    if (brightness < 32) return epd.colors.BLACK;
    if (brightness > 224) return epd.colors.WHITE;

    // Simple color mapping based on dominant channel
    if (r > g && r > b && r > 128) return epd.colors.RED;
    if (g > r && g > b && g > 128) return epd.colors.GREEN;
    if (b > r && b > g && b > 128) return epd.colors.BLUE;
    if (r > 100 && g > 100 && b < 100) return epd.colors.YELLOW;

    return brightness > 128 ? epd.colors.WHITE : epd.colors.BLACK;
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
console.log('ENHANCED VERSION (commented out):');
console.log('- Requires Sharp library: npm install sharp');
console.log('- Properly processes JPEG images');
console.log('- Converts to e-Paper color palette');
console.log('');
console.log('To use the enhanced version:');
console.log('1. Install Sharp: npm install sharp');
console.log('2. Uncomment the convertImageToEPDFormatWithSharp function');
console.log('3. Replace the function call in displayImageExample()');
console.log('');
console.log('='.repeat(60));
console.log('');

// Run the example
displayImageExample().catch(console.error);

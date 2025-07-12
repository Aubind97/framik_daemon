const EPD7in3e = require('../index.js');
const fs = require('fs');
const path = require('path');

// Example showing how to load and display an image file on the e-Paper display
// This version uses proper color mapping based on the InkyPi approach

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

        // Load and process the real image with proper color mapping
        console.log('Converting image to e-Paper format with proper color mapping...');
        let imageBuffer;

        try {
            // Try to use Sharp for real image processing
            imageBuffer = await convertImageWithProperColorMapping(epd, imagePath);
        } catch (error) {
            if (error.message.includes('Cannot find module \'sharp\'')) {
                console.warn('Sharp library not found. Using fallback pattern.');
                console.warn('To process real images, install Sharp: npm install sharp');
                imageBuffer = createColorTestPattern(epd);
            } else {
                throw error;
            }
        }

        // Display the image
        console.log('Displaying image on e-Paper display...');
        epd.display(imageBuffer);

        // Wait to show the image
        console.log('Image displayed. Waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));

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
 * Convert image using Sharp with proper color mapping
 * This preserves the actual image colors by using optimal color distance calculation
 */
async function convertImageWithProperColorMapping(epd, imagePath) {
    const sharp = require('sharp');
    
    // Resize image to fit display while maintaining aspect ratio
    const displayWidth = epd.getWidth();
    const displayHeight = epd.getHeight();
    
    const { data, info } = await sharp(imagePath)
        .resize(displayWidth, displayHeight, {
            fit: 'inside',
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255 }
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

    console.log(`Processed image: ${info.width}x${info.height} channels: ${info.channels}`);

    // Create buffer for the display (each byte contains 2 pixels, 4 bits each)
    const buffer = epd.createBuffer(epd.colors.WHITE);

    // Process RGB data with proper color mapping
    const { width, height, channels } = info;
    let colorStats = new Map();

    // Calculate offset to center the image if it's smaller than display
    const offsetX = Math.floor((displayWidth - width) / 2);
    const offsetY = Math.floor((displayHeight - height) / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * channels;
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];

            // Use improved color mapping that considers perceptual color distance
            const displayColor = mapRGBToDisplayColorImproved(epd, r, g, b);
            
            // Set pixel at correct position (centered)
            const displayX = x + offsetX;
            const displayY = y + offsetY;
            
            if (displayX >= 0 && displayX < displayWidth && 
                displayY >= 0 && displayY < displayHeight) {
                epd.setPixel(buffer, displayX, displayY, displayColor);
            }

            // Track color usage for statistics
            const colorName = getColorName(epd, displayColor);
            colorStats.set(colorName, (colorStats.get(colorName) || 0) + 1);
        }
    }

    // Log color distribution
    console.log('\n=== COLOR MAPPING STATISTICS ===');
    for (const [color, count] of colorStats.entries()) {
        const percentage = ((count / (width * height)) * 100).toFixed(1);
        console.log(`${color}: ${count} pixels (${percentage}%)`);
    }

    return buffer;
}

/**
 * Improved RGB to display color mapping using perceptual color distance
 * Based on human vision sensitivity (more weight to green, less to blue)
 */
function mapRGBToDisplayColorImproved(epd, r, g, b) {
    // Define the available display colors with their RGB values
    const displayColors = [
        { color: epd.colors.BLACK, r: 0, g: 0, b: 0, name: 'BLACK' },
        { color: epd.colors.WHITE, r: 255, g: 255, b: 255, name: 'WHITE' },
        { color: epd.colors.YELLOW, r: 255, g: 255, b: 0, name: 'YELLOW' },
        { color: epd.colors.RED, r: 255, g: 0, b: 0, name: 'RED' },
        { color: epd.colors.BLUE, r: 0, g: 0, b: 255, name: 'BLUE' },
        { color: epd.colors.GREEN, r: 0, g: 255, b: 0, name: 'GREEN' }
    ];

    // First check for exact matches
    for (const dispColor of displayColors) {
        if (r === dispColor.r && g === dispColor.g && b === dispColor.b) {
            return dispColor.color;
        }
    }

    // Use weighted Euclidean distance that considers human vision sensitivity
    // Human eyes are more sensitive to green, less to blue
    let minDistance = Infinity;
    let closestColor = epd.colors.BLACK;

    for (const dispColor of displayColors) {
        // Weighted distance formula for better perceptual matching
        const dr = r - dispColor.r;
        const dg = g - dispColor.g;
        const db = b - dispColor.b;
        
        // Weights based on human vision sensitivity
        const distance = Math.sqrt(
            2.0 * dr * dr +
            4.0 * dg * dg +
            1.0 * db * db
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = dispColor.color;
        }
    }

    return closestColor;
}

/**
 * Get color name from color value
 */
function getColorName(epd, colorValue) {
    const colorMap = {
        [epd.colors.BLACK]: 'BLACK',
        [epd.colors.WHITE]: 'WHITE',
        [epd.colors.YELLOW]: 'YELLOW',
        [epd.colors.RED]: 'RED',
        [epd.colors.BLUE]: 'BLUE',
        [epd.colors.GREEN]: 'GREEN'
    };
    return colorMap[colorValue] || 'UNKNOWN';
}

/**
 * Create a color test pattern when Sharp is not available
 */
function createColorTestPattern(epd) {
    console.log('Creating color test pattern...');
    
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const width = epd.getWidth();
    const height = epd.getHeight();
    
    // Create horizontal color bands
    const bandHeight = Math.floor(height / 6);
    const colors = [
        epd.colors.BLACK,
        epd.colors.RED,
        epd.colors.GREEN,
        epd.colors.BLUE,
        epd.colors.YELLOW,
        epd.colors.WHITE
    ];
    
    for (let y = 0; y < height; y++) {
        const bandIndex = Math.min(Math.floor(y / bandHeight), colors.length - 1);
        const color = colors[bandIndex];
        
        for (let x = 0; x < width; x++) {
            // Add some pattern variation
            if (x % 50 < 5 || y % 50 < 5) {
                // Grid lines in black
                epd.setPixel(buffer, x, y, epd.colors.BLACK);
            } else {
                epd.setPixel(buffer, x, y, color);
            }
        }
    }
    
    // Add text area
    drawSimpleText(epd, buffer, 'NO SHARP LIBRARY', 50, 50, epd.colors.BLACK);
    drawSimpleText(epd, buffer, 'INSTALL: npm install sharp', 50, 100, epd.colors.BLACK);
    
    return buffer;
}

/**
 * Draw simple text on the buffer
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

// Usage instructions
console.log('='.repeat(60));
console.log('E-Paper Display Image Example (Fixed Version)');
console.log('='.repeat(60));
console.log('');
console.log('This example demonstrates proper color mapping for e-Paper displays.');
console.log('');
console.log('FEATURES:');
console.log('- Perceptual color distance calculation');
console.log('- Proper image resizing and centering');
console.log('- Color distribution statistics');
console.log('- Fallback pattern when Sharp is not available');
console.log('');
console.log('REQUIREMENTS:');
console.log('- Sharp library for image processing: npm install sharp');
console.log('- Image file at ../images/img.jpg');
console.log('');
console.log('IMPROVEMENTS:');
console.log('- Uses weighted color distance for better visual results');
console.log('- Preserves image aspect ratio');
console.log('- Centers images on display');
console.log('- Shows color mapping statistics');
console.log('');
console.log('='.repeat(60));
console.log('');

// Run the example
displayImageExample().catch(console.error);
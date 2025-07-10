const EPD7in3e = require('../index.js');

// Advanced example showing how to create and manipulate custom image buffers

async function customImageExample() {
    const epd = new EPD7in3e();
    
    try {
        console.log('Initializing e-Paper display...');
        epd.init();
        
        console.log(`Display dimensions: ${epd.getWidth()}x${epd.getHeight()}`);
        console.log('Available colors:', Object.keys(epd.colors));
        
        // Create a custom image buffer
        console.log('Creating custom image...');
        const imageBuffer = epd.createBuffer(epd.colors.WHITE);
        
        // Draw some patterns
        drawColorBars(epd, imageBuffer);
        
        // Display the custom image
        console.log('Displaying custom image...');
        epd.display(imageBuffer);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Create a checkerboard pattern
        console.log('Creating checkerboard pattern...');
        const checkerboardBuffer = createCheckerboard(epd);
        epd.display(checkerboardBuffer);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Create a gradient pattern
        console.log('Creating gradient pattern...');
        const gradientBuffer = createGradient(epd);
        epd.display(gradientBuffer);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Create a border pattern
        console.log('Creating border pattern...');
        const borderBuffer = createBorder(epd);
        epd.display(borderBuffer);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Clear display
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

// Draw horizontal color bars
function drawColorBars(epd, buffer) {
    const colors = [
        epd.colors.BLACK,
        epd.colors.WHITE,
        epd.colors.YELLOW,
        epd.colors.RED,
        epd.colors.BLUE,
        epd.colors.GREEN
    ];
    
    const barHeight = Math.floor(epd.getHeight() / colors.length);
    
    for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
        const startY = colorIndex * barHeight;
        const endY = Math.min(startY + barHeight, epd.getHeight());
        
        for (let y = startY; y < endY; y++) {
            for (let x = 0; x < epd.getWidth(); x++) {
                epd.setPixel(buffer, x, y, colors[colorIndex]);
            }
        }
    }
}

// Create a checkerboard pattern
function createCheckerboard(epd) {
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const squareSize = 40;
    
    for (let y = 0; y < epd.getHeight(); y++) {
        for (let x = 0; x < epd.getWidth(); x++) {
            const squareX = Math.floor(x / squareSize);
            const squareY = Math.floor(y / squareSize);
            
            // Alternate between black and white
            if ((squareX + squareY) % 2 === 0) {
                epd.setPixel(buffer, x, y, epd.colors.BLACK);
            } else {
                epd.setPixel(buffer, x, y, epd.colors.WHITE);
            }
        }
    }
    
    return buffer;
}

// Create a gradient pattern using different colors
function createGradient(epd) {
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const colors = [
        epd.colors.BLACK,
        epd.colors.BLUE,
        epd.colors.GREEN,
        epd.colors.YELLOW,
        epd.colors.RED,
        epd.colors.WHITE
    ];
    
    for (let y = 0; y < epd.getHeight(); y++) {
        // Calculate which color to use based on Y position
        const colorIndex = Math.floor((y / epd.getHeight()) * colors.length);
        const actualColorIndex = Math.min(colorIndex, colors.length - 1);
        
        for (let x = 0; x < epd.getWidth(); x++) {
            epd.setPixel(buffer, x, y, colors[actualColorIndex]);
        }
    }
    
    return buffer;
}

// Create a border pattern
function createBorder(epd) {
    const buffer = epd.createBuffer(epd.colors.WHITE);
    const borderWidth = 20;
    const colors = [
        epd.colors.BLACK,
        epd.colors.RED,
        epd.colors.BLUE,
        epd.colors.GREEN,
        epd.colors.YELLOW
    ];
    
    for (let y = 0; y < epd.getHeight(); y++) {
        for (let x = 0; x < epd.getWidth(); x++) {
            const distanceFromEdge = Math.min(
                x,
                y,
                epd.getWidth() - 1 - x,
                epd.getHeight() - 1 - y
            );
            
            if (distanceFromEdge < borderWidth * colors.length) {
                const colorIndex = Math.floor(distanceFromEdge / borderWidth);
                if (colorIndex < colors.length) {
                    epd.setPixel(buffer, x, y, colors[colorIndex]);
                }
            }
        }
    }
    
    return buffer;
}

// Helper function to print pixel information
function printPixelInfo(epd, buffer, x, y) {
    const pixel = epd.getPixel(buffer, x, y);
    const colorName = Object.keys(epd.colors).find(key => epd.colors[key] === pixel);
    console.log(`Pixel at (${x}, ${y}): ${pixel} (${colorName})`);
}

// Example usage with pixel manipulation
function pixelManipulationExample(epd) {
    console.log('Pixel manipulation example:');
    const buffer = epd.createBuffer(epd.colors.WHITE);
    
    // Set some individual pixels
    epd.setPixel(buffer, 100, 100, epd.colors.BLACK);
    epd.setPixel(buffer, 101, 100, epd.colors.RED);
    epd.setPixel(buffer, 102, 100, epd.colors.BLUE);
    
    // Read back the pixels
    printPixelInfo(epd, buffer, 100, 100);
    printPixelInfo(epd, buffer, 101, 100);
    printPixelInfo(epd, buffer, 102, 100);
    
    return buffer;
}

// Run the example
customImageExample().catch(console.error);
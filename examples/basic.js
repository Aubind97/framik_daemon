const EPD7in3e = require('../index.js');

// Basic usage example for the EPD 7in3e e-Paper display

async function basicExample() {
    const epd = new EPD7in3e();
    
    try {
        console.log('Initializing e-Paper display...');
        epd.init();
        
        console.log(`Display dimensions: ${epd.getWidth()}x${epd.getHeight()}`);
        console.log(`Buffer size: ${epd.getBufferSize()} bytes`);
        
        // Clear the display with white color
        console.log('Clearing display...');
        epd.clear(epd.colors.WHITE);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show the 7-color block test pattern
        console.log('Displaying 7-color block pattern...');
        epd.show7Block();
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Show the color test pattern
        console.log('Displaying color test pattern...');
        epd.show();
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Clear with black
        console.log('Clearing with black...');
        epd.clear(epd.colors.BLACK);
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
basicExample().catch(console.error);
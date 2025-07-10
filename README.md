# EPD 7in3e Node.js Addon

A standalone Node.js addon for controlling the Waveshare 7.3inch e-Paper display (EPD_7in3e) from JavaScript. This addon wraps the native C SDK to provide a JavaScript interface for the e-Paper display.

## Features

- **Standalone**: Contains all necessary C code and dependencies
- **Cross-platform**: Supports Raspberry Pi and Jetson Nano
- **Easy to use**: Simple JavaScript API with TypeScript support
- **Complete**: Includes all EPD_7in3e functions from the original SDK
- **Buffer manipulation**: Helper functions for creating and manipulating image buffers
- **Color support**: Full 7-color support (Black, White, Yellow, Red, Blue, Green)

## Hardware Requirements

- Raspberry Pi (with GPIO support) or Jetson Nano
- Waveshare 7.3inch e-Paper display (EPD_7in3e)
- Proper wiring between the display and GPIO pins

## Installation

### Prerequisites

1. **Node.js**: Version 14.0.0 or higher
2. **Build tools**: 
   ```bash
   # On Raspberry Pi/Debian/Ubuntu
   sudo apt-get update
   sudo apt-get install build-essential python3-dev
   
   # Install libgpiod for GPIO access
   sudo apt-get install libgpiod-dev
   ```

3. **node-gyp**: For building native addons
   ```bash
   npm install -g node-gyp
   ```

### Building the Addon

1. Navigate to the addon directory:
   ```bash
   cd nodejs-epd-addon
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the addon:
   ```bash
   npm run build
   ```

   Or install (which builds automatically):
   ```bash
   npm install
   ```

## Usage

### Basic Usage

```javascript
const EPD7in3e = require('./index.js');

async function example() {
    const epd = new EPD7in3e();
    
    try {
        // Initialize the display
        epd.init();
        
        // Clear the display with white color
        epd.clear(epd.colors.WHITE);
        
        // Display the 7-color test pattern
        epd.show7Block();
        
        // Wait for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Put display to sleep
        epd.sleep();
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Always cleanup
        epd.exit();
    }
}

example().catch(console.error);
```

### Custom Image Buffer

```javascript
const EPD7in3e = require('./index.js');

function createCustomImage() {
    const epd = new EPD7in3e();
    
    try {
        epd.init();
        
        // Create a blank white buffer
        const imageBuffer = epd.createBuffer(epd.colors.WHITE);
        
        // Draw some pixels
        epd.setPixel(imageBuffer, 100, 100, epd.colors.BLACK);
        epd.setPixel(imageBuffer, 101, 100, epd.colors.RED);
        epd.setPixel(imageBuffer, 102, 100, epd.colors.BLUE);
        
        // Display the custom image
        epd.display(imageBuffer);
        
        // Read back a pixel
        const pixel = epd.getPixel(imageBuffer, 100, 100);
        console.log('Pixel value:', pixel);
        
        epd.sleep();
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        epd.exit();
    }
}

createCustomImage();
```

## API Reference

### Class: EPD7in3e

#### Constructor
```javascript
const epd = new EPD7in3e();
```

#### Properties
- `width`: Display width in pixels (800)
- `height`: Display height in pixels (480)
- `bufferSize`: Size of image buffer in bytes
- `colors`: Object containing color constants

#### Methods

##### `init()`
Initialize the e-Paper display. Must be called before any other operations.

##### `clear(color)`
Clear the display with a specified color.
- `color` (number): Color value (use `colors` constants)

##### `show7Block()`
Display the 7-color block test pattern.

##### `show()`
Display the color test pattern.

##### `display(imageBuffer)`
Display an image buffer.
- `imageBuffer` (Buffer): Image data buffer

##### `sleep()`
Put the display to sleep mode.

##### `exit()`
Exit and cleanup the module.

##### `getWidth()`
Get display width in pixels.

##### `getHeight()`
Get display height in pixels.

##### `getBufferSize()`
Get buffer size needed for display in bytes.

##### `getColors()`
Get color constants object.

##### `createBuffer(color)`
Create a blank image buffer.
- `color` (number, optional): Fill color (default: WHITE)

##### `setPixel(buffer, x, y, color)`
Set a pixel in the image buffer.
- `buffer` (Buffer): Image buffer
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `color` (number): Color value

##### `getPixel(buffer, x, y)`
Get a pixel from the image buffer.
- `buffer` (Buffer): Image buffer
- `x` (number): X coordinate
- `y` (number): Y coordinate

### Color Constants

```javascript
epd.colors.BLACK   // 0x0
epd.colors.WHITE   // 0x1
epd.colors.YELLOW  // 0x2
epd.colors.RED     // 0x3
epd.colors.BLUE    // 0x5
epd.colors.GREEN   // 0x6
```

## Display Specifications

- **Resolution**: 800×480 pixels
- **Colors**: 7 colors (Black, White, Yellow, Red, Blue, Green, Orange)
- **Interface**: SPI
- **Pixel Format**: 4-bit per pixel (2 pixels per byte)

## Buffer Format

The display uses a packed pixel format where each byte contains 2 pixels:
- High nibble (bits 7-4): Left pixel
- Low nibble (bits 3-0): Right pixel

Buffer size calculation:
```javascript
const bufferWidth = (width % 2 === 0) ? (width / 2) : (width / 2 + 1);
const bufferSize = bufferWidth * height;
```

## GPIO Pin Configuration

The addon uses the following default GPIO pins (BCM numbering):

| Function | GPIO Pin |
|----------|----------|
| RST      | 17       |
| DC       | 25       |
| CS       | 8        |
| BUSY     | 24       |
| PWR      | 18       |
| MOSI     | 10       |
| SCLK     | 11       |

## Examples

Check the `examples/` directory for more detailed examples:
- `basic.js`: Basic usage example
- `custom-image.js`: Advanced example with custom image buffers

## Compilation Options

The addon supports different compilation configurations:

### For Raspberry Pi (default):
```bash
npm run build
```

### For Jetson Nano:
```bash
npm run build -- --define=JETSON=1
```

### Debug Build:
```bash
npm run build -- --define=DEBUG=1
```

## Troubleshooting

### Permission Issues
If you encounter permission errors accessing GPIO:
```bash
sudo usermod -a -G gpio $USER
# Log out and log back in
```

### Build Errors
1. Ensure all prerequisites are installed
2. Check that `libgpiod-dev` is installed
3. Try cleaning and rebuilding:
   ```bash
   npm run clean
   npm run build
   ```

### Display Not Working
1. Check wiring connections
2. Verify power supply
3. Ensure SPI is enabled:
   ```bash
   sudo raspi-config
   # Navigate to Interface Options -> SPI -> Enable
   ```

## License

This addon is based on the Waveshare e-Paper library and is provided under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues related to:
- **Hardware**: Check Waveshare documentation
- **Addon**: Create an issue in this repository
- **Node.js**: Check Node.js documentation

## Changelog

### Version 1.0.0
- Initial release
- Full EPD_7in3e support
- TypeScript declarations
- Buffer manipulation helpers
- Example code
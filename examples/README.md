# Image Display Examples

This directory contains examples for displaying images on the Waveshare 7.3inch e-Paper display using the Node.js addon.

## Files Overview

### `display-image.js`
A Node.js example that demonstrates how to load and display the `img.jpg` image on the e-Paper display.

**Features:**
- Basic image placeholder display (no external dependencies)
- Enhanced version with Sharp library support (commented out)
- Proper e-Paper display initialization and cleanup
- Color conversion to 7-color e-Paper palette

**Usage:**
```bash
node display-image.js
```

**Enhanced Version (requires Sharp):**
```bash
npm install sharp
# Then uncomment the enhanced functions in the code
node display-image.js
```

### `view-image.html`
A simple HTML viewer for the `img.jpg` image that can be opened in any web browser.

**Features:**
- Responsive image display
- Zoom controls (25% to 400%)
- Image information display
- Keyboard shortcuts (1: actual size, 0: fit window, +/-: zoom, i: toggle info)
- Error handling for missing images

**Usage:**
Open the file in any web browser:
```bash
open view-image.html
# or
python3 -m http.server 8000
# then visit http://localhost:8000/examples/view-image.html
```

## Available Images

- `../images/img.jpg` - The sample image file

## Color Palette

The e-Paper display supports 7 colors:
- BLACK
- WHITE
- RED
- GREEN
- BLUE
- YELLOW
- ORANGE (if available)

## Image Processing Notes

### Basic Version (Default)
- Creates a placeholder pattern representing the image
- No external dependencies required
- Demonstrates the API usage

### Enhanced Version (Sharp Library)
- Requires `npm install sharp`
- Properly processes JPEG images
- Resizes images to fit the display
- Converts RGB colors to nearest e-Paper colors
- Provides better image quality

## Display Specifications

The Waveshare 7.3inch e-Paper display has the following specifications:
- Resolution: Check with `epd.getWidth()` and `epd.getHeight()`
- Color depth: 4-bit (7 colors)
- Display technology: E-Ink

## API Reference

### Key Methods Used

```javascript
const epd = new EPD7in3e();

// Initialize display
epd.init();

// Get display dimensions
const width = epd.getWidth();
const height = epd.getHeight();

// Create buffer
const buffer = epd.createBuffer(epd.colors.WHITE);

// Set pixel
epd.setPixel(buffer, x, y, color);

// Display buffer
epd.display(buffer);

// Cleanup
epd.sleep();
epd.exit();
```

### Available Colors

```javascript
epd.colors.BLACK
epd.colors.WHITE
epd.colors.RED
epd.colors.GREEN
epd.colors.BLUE
epd.colors.YELLOW
// Additional colors may be available depending on display model
```

## Troubleshooting

### Image Not Found
- Ensure `img.jpg` exists in the `../images/` directory
- Check file permissions
- Verify the file path is correct

### Display Initialization Error
- Make sure the display is properly connected
- Check that the addon was compiled correctly
- Verify hardware compatibility

### Sharp Library Issues
- Install Sharp: `npm install sharp`
- For ARM devices (Raspberry Pi), you may need: `npm install --platform=linux --arch=arm64 sharp`

## Performance Tips

1. **Image Size**: Resize images to match the display resolution before processing
2. **Color Conversion**: Use dithering for better grayscale conversion
3. **Memory Usage**: Process images in chunks for large files
4. **Display Updates**: Minimize display updates as e-Paper displays are slow

## Related Examples

- `basic.js` - Basic display functionality
- `custom-image.js` - Custom image buffer creation and manipulation

## License

This example code is provided under the same license as the main project.
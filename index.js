const addon = require('./build/Release/epd_7in3e_addon.node');

/**
 * Waveshare 7.3inch e-Paper Display (EPD_7in3e) Node.js Module
 * 
 * This module provides a JavaScript interface to control the Waveshare 7.3inch e-Paper display.
 * It wraps the native C library with a Node.js addon for easy integration.
 */
class EPD7in3e {
    constructor() {
        this.initialized = false;
        this.width = addon.getWidth();
        this.height = addon.getHeight();
        this.bufferSize = addon.getBufferSize();
        this.colors = addon.Colors;
    }

    /**
     * Initialize the e-Paper display
     * Must be called before any other operations
     */
    init() {
        if (this.initialized) {
            throw new Error('Display already initialized');
        }
        addon.init();
        this.initialized = true;
    }

    /**
     * Clear the display with a specified color
     * @param {number} color - Color value (use Colors constants)
     */
    clear(color = this.colors.WHITE) {
        this._checkInitialized();
        addon.clear(color);
    }

    /**
     * Display the 7-color block test pattern
     */
    show7Block() {
        this._checkInitialized();
        addon.show7Block();
    }

    /**
     * Display the color test pattern
     */
    show() {
        this._checkInitialized();
        addon.show();
    }

    /**
     * Display an image buffer
     * @param {Buffer} imageBuffer - Image data buffer
     */
    display(imageBuffer) {
        this._checkInitialized();
        
        if (!Buffer.isBuffer(imageBuffer)) {
            throw new Error('Expected a Buffer object');
        }
        
        if (imageBuffer.length !== this.bufferSize) {
            throw new Error(`Buffer size mismatch. Expected ${this.bufferSize} bytes, got ${imageBuffer.length}`);
        }
        
        addon.display(imageBuffer);
    }

    /**
     * Put the display to sleep mode
     */
    sleep() {
        this._checkInitialized();
        addon.sleep();
    }

    /**
     * Exit and cleanup the module
     */
    exit() {
        if (this.initialized) {
            addon.exit();
            this.initialized = false;
        }
    }

    /**
     * Get display width
     * @returns {number} Width in pixels
     */
    getWidth() {
        return this.width;
    }

    /**
     * Get display height
     * @returns {number} Height in pixels
     */
    getHeight() {
        return this.height;
    }

    /**
     * Get buffer size needed for display
     * @returns {number} Buffer size in bytes
     */
    getBufferSize() {
        return this.bufferSize;
    }

    /**
     * Get color constants
     * @returns {Object} Color constants object
     */
    getColors() {
        return this.colors;
    }

    /**
     * Create a blank image buffer
     * @param {number} color - Fill color (default: WHITE)
     * @returns {Buffer} Image buffer
     */
    createBuffer(color = this.colors.WHITE) {
        const buffer = Buffer.alloc(this.bufferSize);
        const pixelValue = (color << 4) | color;
        buffer.fill(pixelValue);
        return buffer;
    }

    /**
     * Set a pixel in the image buffer
     * @param {Buffer} buffer - Image buffer
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} color - Color value
     */
    setPixel(buffer, x, y, color) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Expected a Buffer object');
        }
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error('Coordinates out of bounds');
        }
        
        const bufferWidth = (this.width % 2 === 0) ? (this.width / 2) : (this.width / 2 + 1);
        const byteIndex = Math.floor(x / 2) + y * bufferWidth;
        
        if (x % 2 === 0) {
            // Even column - high nibble
            buffer[byteIndex] = (buffer[byteIndex] & 0x0F) | (color << 4);
        } else {
            // Odd column - low nibble
            buffer[byteIndex] = (buffer[byteIndex] & 0xF0) | (color & 0x0F);
        }
    }

    /**
     * Set a pixel with full RGB color preservation using BMP-compatible color mapping
     * @param {Buffer} buffer - Image buffer
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     */
    setPixelRGB(buffer, x, y, r, g, b) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Expected a Buffer object');
        }
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error('Coordinates out of bounds');
        }

        // Use BMP-compatible color mapping to preserve actual colors
        const colorValue = this.mapRGBToDisplayColor(r, g, b);
        this.setPixel(buffer, x, y, colorValue);
    }

    /**
     * Map RGB values to display colors using the same logic as GUI.c BMP functions
     * This preserves actual colors instead of forcing them into Red/Green/Blue only
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {number} Display color value
     */
    mapRGBToDisplayColor(r, g, b) {
        // Based on GUI_ReadBmp_RGB_7Color and GUI_ReadBmp_RGB_6Color logic
        // but with improved color distance calculation for better color matching
        
        // Define the available display colors with their RGB values
        const displayColors = [
            { color: this.colors.BLACK, r: 0, g: 0, b: 0 },           // Black
            { color: this.colors.WHITE, r: 255, g: 255, b: 255 },     // White
            { color: this.colors.YELLOW, r: 255, g: 255, b: 0 },      // Yellow
            { color: this.colors.RED, r: 255, g: 0, b: 0 },           // Red
            { color: this.colors.BLUE, r: 0, g: 0, b: 255 },          // Blue
            { color: this.colors.GREEN, r: 0, g: 255, b: 0 }          // Green
        ];

        // First try exact matches (like the original BMP functions)
        for (const dispColor of displayColors) {
            if (r === dispColor.r && g === dispColor.g && b === dispColor.b) {
                return dispColor.color;
            }
        }

        // If no exact match, find the closest color by calculating color distance
        let minDistance = Infinity;
        let closestColor = this.colors.BLACK;

        for (const dispColor of displayColors) {
            // Calculate Euclidean distance in RGB space
            const distance = Math.sqrt(
                Math.pow(r - dispColor.r, 2) + 
                Math.pow(g - dispColor.g, 2) + 
                Math.pow(b - dispColor.b, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = dispColor.color;
            }
        }

        return closestColor;
    }

    /**
     * Enhanced RGB encoding that preserves more color information
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {number} Encoded color value
     */
    encodeRGBToDisplayFormat(r, g, b) {
        // Use the BMP-compatible mapping as the primary method
        return this.mapRGBToDisplayColor(r, g, b);
    }

    /**
     * Create a buffer from RGB image data using BMP-compatible color mapping
     * @param {Uint8Array} rgbData - RGB image data array
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {number} channels - Number of color channels (3 for RGB, 4 for RGBA)
     * @returns {Buffer} Display buffer with preserved colors
     */
    createBufferFromRGB(rgbData, width, height, channels = 3) {
        const buffer = Buffer.alloc(this.bufferSize);
        
        // Process each pixel using BMP-compatible color mapping
        for (let y = 0; y < Math.min(height, this.height); y++) {
            for (let x = 0; x < Math.min(width, this.width); x++) {
                const pixelIndex = (y * width + x) * channels;
                const r = rgbData[pixelIndex];
                const g = rgbData[pixelIndex + 1];
                const b = rgbData[pixelIndex + 2];
                
                // Use the BMP-compatible color mapping
                const displayColor = this.mapRGBToDisplayColor(r, g, b);
                this.setPixel(buffer, x, y, displayColor);
            }
        }
        
        return buffer;
    }

    /**
     * Create a buffer from RGB image data with advanced color mapping options
     * @param {Uint8Array} rgbData - RGB image data array
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {number} channels - Number of color channels (3 for RGB, 4 for RGBA)
     * @param {string} method - Color mapping method: 'closest' (default), 'threshold', 'exact'
     * @returns {Buffer} Display buffer with preserved colors
     */
    createBufferFromRGBAdvanced(rgbData, width, height, channels = 3, method = 'closest') {
        const buffer = Buffer.alloc(this.bufferSize);
        
        for (let y = 0; y < Math.min(height, this.height); y++) {
            for (let x = 0; x < Math.min(width, this.width); x++) {
                const pixelIndex = (y * width + x) * channels;
                const r = rgbData[pixelIndex];
                const g = rgbData[pixelIndex + 1];
                const b = rgbData[pixelIndex + 2];
                
                let displayColor;
                
                switch (method) {
                    case 'threshold':
                        // Use threshold-based mapping (like GUI_ReadBmp_RGB_4Color)
                        displayColor = this.mapRGBWithThreshold(r, g, b);
                        break;
                    case 'exact':
                        // Use exact color matching only
                        displayColor = this.mapRGBExact(r, g, b);
                        break;
                    default:
                        // Use closest color matching (default)
                        displayColor = this.mapRGBToDisplayColor(r, g, b);
                }
                
                this.setPixel(buffer, x, y, displayColor);
            }
        }
        
        return buffer;
    }

    /**
     * Map RGB using threshold method (based on GUI_ReadBmp_RGB_4Color)
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {number} Display color value
     */
    mapRGBWithThreshold(r, g, b) {
        // Based on GUI_ReadBmp_RGB_4Color logic
        if (r < 128 && g < 128 && b < 128) {
            return this.colors.BLACK;
        } else if (r > 127 && g > 127 && b > 127) {
            return this.colors.WHITE;
        } else if (r < 128 && g > 127 && b > 127) {
            return this.colors.YELLOW;
        } else if (r < 128 && g < 128 && b > 127) {
            return this.colors.RED;
        } else if (r > 127 && g < 128 && b < 128) {
            return this.colors.BLUE;
        } else if (r < 128 && g > 127 && b < 128) {
            return this.colors.GREEN;
        } else {
            // Default to closest color for edge cases
            return this.mapRGBToDisplayColor(r, g, b);
        }
    }

    /**
     * Map RGB using exact color matching only
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {number} Display color value
     */
    mapRGBExact(r, g, b) {
        // Based on GUI_ReadBmp_RGB_7Color exact matching logic
        if (r === 0 && g === 0 && b === 0) {
            return this.colors.BLACK;
        } else if (r === 255 && g === 255 && b === 255) {
            return this.colors.WHITE;
        } else if (r === 255 && g === 255 && b === 0) {
            return this.colors.YELLOW;
        } else if (r === 255 && g === 0 && b === 0) {
            return this.colors.RED;
        } else if (r === 0 && g === 0 && b === 255) {
            return this.colors.BLUE;
        } else if (r === 0 && g === 255 && b === 0) {
            return this.colors.GREEN;
        } else {
            // If no exact match, fall back to closest color
            return this.mapRGBToDisplayColor(r, g, b);
        }
    }

    /**
     * Create a test pattern with full color range
     * @param {string} pattern - Pattern type: 'gradient', 'rainbow', 'natural'
     * @returns {Buffer} Test pattern buffer
     */
    createFullColorTestPattern(pattern = 'gradient') {
        const buffer = Buffer.alloc(this.bufferSize);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let r, g, b;
                
                switch (pattern) {
                    case 'gradient':
                        r = Math.floor(255 * (x / this.width));
                        g = Math.floor(255 * (y / this.height));
                        b = Math.floor(255 * ((x + y) / (this.width + this.height)));
                        break;
                    case 'rainbow':
                        const hue = (x / this.width) * 360;
                        const rgb = this.hslToRgb(hue, 100, 50);
                        r = rgb.r;
                        g = rgb.g;
                        b = rgb.b;
                        break;
                    case 'natural':
                        const section = Math.floor(y / (this.height / 4));
                        const progress = (x / this.width);
                        switch (section) {
                            case 0: // Sky
                                r = Math.floor(135 + 120 * progress);
                                g = Math.floor(206 + 49 * progress);
                                b = Math.floor(235 + 20 * progress);
                                break;
                            case 1: // Grass
                                r = Math.floor(34 + 100 * progress);
                                g = Math.floor(139 + 116 * progress);
                                b = Math.floor(34 + 50 * progress);
                                break;
                            case 2: // Sunset
                                r = Math.floor(255 * (1 - progress * 0.3));
                                g = Math.floor(165 * (1 - progress * 0.5));
                                b = Math.floor(0 + 100 * progress);
                                break;
                            default: // Ocean
                                r = Math.floor(0 + 50 * progress);
                                g = Math.floor(105 + 150 * progress);
                                b = Math.floor(148 + 107 * progress);
                                break;
                        }
                        break;
                    default:
                        r = g = b = 128; // Gray
                }
                
                this.setPixelRGB(buffer, x, y, r, g, b);
            }
        }
        
        return buffer;
    }

    /**
     * Convert HSL to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {Object} RGB values
     */
    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Analyze color distribution in a buffer
     * @param {Buffer} buffer - Image buffer to analyze
     * @returns {Object} Color analysis results
     */
    analyzeColorDistribution(buffer) {
        const samples = [];
        const sampleCount = 25;
        
        for (let i = 0; i < sampleCount; i++) {
            const x = Math.floor((i % 5) * this.width / 5);
            const y = Math.floor(Math.floor(i / 5) * this.height / 5);
            
            const pixelValue = this.getPixel(buffer, x, y);
            samples.push({
                x, y, value: pixelValue,
                hex: `0x${pixelValue.toString(16).padStart(2, '0')}`
            });
        }
        
        // Calculate color diversity
        const uniqueColors = new Set(samples.map(s => s.value));
        
        return {
            samples,
            uniqueColors: uniqueColors.size,
            totalSamples: samples.length,
            colorDiversity: (uniqueColors.size / samples.length) * 100
        };
    }

    /**
     * Get a pixel from the image buffer
     * @param {Buffer} buffer - Image buffer
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Color value
     */
    getPixel(buffer, x, y) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Expected a Buffer object');
        }
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error('Coordinates out of bounds');
        }
        
        const bufferWidth = (this.width % 2 === 0) ? (this.width / 2) : (this.width / 2 + 1);
        const byteIndex = Math.floor(x / 2) + y * bufferWidth;
        
        if (x % 2 === 0) {
            // Even column - high nibble
            return (buffer[byteIndex] & 0xF0) >> 4;
        } else {
            // Odd column - low nibble
            return buffer[byteIndex] & 0x0F;
        }
    }

    /**
     * Internal method to check if display is initialized
     * @private
     */
    _checkInitialized() {
        if (!this.initialized) {
            throw new Error('Display not initialized. Call init() first.');
        }
    }
}

// Export the class and color constants
module.exports = EPD7in3e;
module.exports.Colors = addon.Colors;
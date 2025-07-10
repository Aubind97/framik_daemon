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
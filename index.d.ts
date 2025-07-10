declare module 'epd-7in3e-addon' {
  export interface Colors {
    BLACK: number;
    WHITE: number;
    YELLOW: number;
    RED: number;
    BLUE: number;
    GREEN: number;
  }

  export class EPD7in3e {
    readonly width: number;
    readonly height: number;
    readonly bufferSize: number;
    readonly colors: Colors;

    constructor();

    /**
     * Initialize the e-Paper display
     * Must be called before any other operations
     */
    init(): void;

    /**
     * Clear the display with a specified color
     * @param color - Color value (use Colors constants)
     */
    clear(color?: number): void;

    /**
     * Display the 7-color block test pattern
     */
    show7Block(): void;

    /**
     * Display the color test pattern
     */
    show(): void;

    /**
     * Display an image buffer
     * @param imageBuffer - Image data buffer
     */
    display(imageBuffer: Buffer): void;

    /**
     * Put the display to sleep mode
     */
    sleep(): void;

    /**
     * Exit and cleanup the module
     */
    exit(): void;

    /**
     * Get display width
     * @returns Width in pixels
     */
    getWidth(): number;

    /**
     * Get display height
     * @returns Height in pixels
     */
    getHeight(): number;

    /**
     * Get buffer size needed for display
     * @returns Buffer size in bytes
     */
    getBufferSize(): number;

    /**
     * Get color constants
     * @returns Color constants object
     */
    getColors(): Colors;

    /**
     * Create a blank image buffer
     * @param color - Fill color (default: WHITE)
     * @returns Image buffer
     */
    createBuffer(color?: number): Buffer;

    /**
     * Set a pixel in the image buffer
     * @param buffer - Image buffer
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param color - Color value
     */
    setPixel(buffer: Buffer, x: number, y: number, color: number): void;

    /**
     * Get a pixel from the image buffer
     * @param buffer - Image buffer
     * @param x - X coordinate
     * @param y - Y coordinate
     * @returns Color value
     */
    getPixel(buffer: Buffer, x: number, y: number): number;
  }

  export const Colors: Colors;
  export default EPD7in3e;
}
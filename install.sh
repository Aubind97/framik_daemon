#!/bin/bash

# Installation script for EPD 7in3e Node.js Addon
# This script automates the setup process for the e-Paper display addon

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to detect platform
detect_platform() {
    if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        echo "rpi"
    elif grep -q "tegra" /proc/cpuinfo 2>/dev/null; then
        echo "jetson"
    else
        echo "unknown"
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    
    sudo apt-get update
    sudo apt-get install -y build-essential python3-dev libgpiod-dev pkg-config
    
    print_success "System dependencies installed"
}

# Function to install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    
    # Check if node-gyp is installed globally
    if ! command_exists node-gyp; then
        print_status "Installing node-gyp globally..."
        sudo npm install -g node-gyp
    fi
    
    # Install local dependencies
    npm install
    
    print_success "Node.js dependencies installed"
}

# Function to build the addon
build_addon() {
    local platform=$1
    
    print_status "Building addon for $platform..."
    
    case $platform in
        "rpi")
            npm run build
            ;;
        "jetson")
            npm run build -- --define=JETSON=1
            ;;
        *)
            print_warning "Unknown platform, building with default settings"
            npm run build
            ;;
    esac
    
    print_success "Addon built successfully"
}

# Function to enable SPI on Raspberry Pi
enable_spi() {
    if [[ "$1" == "rpi" ]]; then
        print_status "Checking SPI configuration..."
        
        if ! grep -q "dtparam=spi=on" /boot/config.txt 2>/dev/null; then
            print_warning "SPI not enabled in /boot/config.txt"
            echo "To enable SPI, run: sudo raspi-config"
            echo "Navigate to: Interface Options -> SPI -> Enable"
            echo "Then reboot your system"
        else
            print_success "SPI is enabled"
        fi
    fi
}

# Function to setup GPIO permissions
setup_gpio_permissions() {
    print_status "Setting up GPIO permissions..."
    
    # Add user to gpio group
    sudo usermod -a -G gpio $USER
    
    print_success "GPIO permissions configured"
    print_warning "You may need to log out and log back in for group changes to take effect"
}

# Function to run basic test
run_test() {
    print_status "Running basic test..."
    
    # Create a simple test file
    cat > test_build.js << 'EOF'
try {
    const EPD7in3e = require('./index.js');
    const epd = new EPD7in3e();
    
    console.log('✓ Module loaded successfully');
    console.log('✓ Display dimensions:', epd.getWidth() + 'x' + epd.getHeight());
    console.log('✓ Buffer size:', epd.getBufferSize(), 'bytes');
    console.log('✓ Colors available:', Object.keys(epd.getColors()).join(', '));
    
    process.exit(0);
} catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
}
EOF
    
    if node test_build.js; then
        print_success "Basic test passed"
    else
        print_error "Basic test failed"
        return 1
    fi
    
    # Clean up test file
    rm -f test_build.js
}

# Main installation function
main() {
    echo "================================================"
    echo "EPD 7in3e Node.js Addon Installation Script"
    echo "================================================"
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
    
    # Detect platform
    PLATFORM=$(detect_platform)
    print_status "Detected platform: $PLATFORM"
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js not found. Please install Node.js first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm not found. Please install npm first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    print_status "Node.js version: $NODE_VERSION"
    
    # Install system dependencies
    install_system_deps
    
    # Install Node.js dependencies
    install_node_deps
    
    # Build the addon
    build_addon "$PLATFORM"
    
    # Setup GPIO permissions
    setup_gpio_permissions
    
    # Enable SPI (for Raspberry Pi)
    enable_spi "$PLATFORM"
    
    # Run basic test
    run_test
    
    echo ""
    echo "================================================"
    print_success "Installation completed successfully!"
    echo "================================================"
    
    echo ""
    echo "Next steps:"
    echo "1. If this is your first time, log out and log back in"
    echo "2. Make sure your e-Paper display is properly connected"
    echo "3. Run the examples:"
    echo "   node examples/basic.js"
    echo "   node examples/custom-image.js"
    echo ""
    echo "For more information, see README.md"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -h, --help     Show this help message"
            echo "  --platform     Force platform (rpi, jetson)"
            echo "  --no-test      Skip basic test"
            echo "  --debug        Enable debug output"
            echo ""
            exit 0
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --no-test)
            SKIP_TEST=1
            shift
            ;;
        --debug)
            set -x
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main
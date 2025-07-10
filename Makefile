# Makefile for EPD 7in3e Node.js Addon

# Default target
all: build

# Install dependencies
install:
	npm install

# Build the addon
build:
	npm run build

# Clean build artifacts
clean:
	npm run clean
	rm -rf build/
	rm -rf node_modules/

# Build for Raspberry Pi (default)
build-rpi:
	npm run build

# Build for Jetson Nano
build-jetson:
	npm run build -- --define=JETSON=1

# Debug build
build-debug:
	npm run build -- --define=DEBUG=1

# Run basic example
example-basic:
	node examples/basic.js

# Run custom image example
example-custom:
	node examples/custom-image.js

# Check if required system packages are installed
check-deps:
	@echo "Checking system dependencies..."
	@which node > /dev/null || (echo "Error: Node.js not found" && exit 1)
	@which npm > /dev/null || (echo "Error: npm not found" && exit 1)
	@which node-gyp > /dev/null || (echo "Error: node-gyp not found. Install with: npm install -g node-gyp" && exit 1)
	@pkg-config --exists libgpiod || (echo "Error: libgpiod-dev not found. Install with: sudo apt-get install libgpiod-dev" && exit 1)
	@echo "All dependencies found!"

# Setup for Raspberry Pi
setup-rpi:
	@echo "Setting up for Raspberry Pi..."
	sudo apt-get update
	sudo apt-get install -y build-essential python3-dev libgpiod-dev
	npm install -g node-gyp

# Setup for Jetson Nano
setup-jetson:
	@echo "Setting up for Jetson Nano..."
	sudo apt-get update
	sudo apt-get install -y build-essential python3-dev libgpiod-dev
	npm install -g node-gyp

# Full setup and build
setup: check-deps install build

# Test build (without hardware)
test-build:
	@echo "Testing build process..."
	npm run clean
	npm run build
	@echo "Build test completed successfully!"

# Help
help:
	@echo "Available targets:"
	@echo "  all           - Build the addon (default)"
	@echo "  install       - Install npm dependencies"
	@echo "  build         - Build the addon"
	@echo "  clean         - Clean build artifacts"
	@echo "  build-rpi     - Build for Raspberry Pi"
	@echo "  build-jetson  - Build for Jetson Nano"
	@echo "  build-debug   - Build with debug information"
	@echo "  example-basic - Run basic example"
	@echo "  example-custom- Run custom image example"
	@echo "  check-deps    - Check system dependencies"
	@echo "  setup-rpi     - Setup environment for Raspberry Pi"
	@echo "  setup-jetson  - Setup environment for Jetson Nano"
	@echo "  setup         - Full setup and build"
	@echo "  test-build    - Test build without hardware"
	@echo "  help          - Show this help"

# Phony targets
.PHONY: all install build clean build-rpi build-jetson build-debug example-basic example-custom check-deps setup-rpi setup-jetson setup test-build help
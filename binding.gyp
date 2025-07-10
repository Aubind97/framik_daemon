{
  "targets": [
    {
      "target_name": "epd_7in3e_addon",
      "sources": [
        "src/addon.cpp",
        "src/EPD_7in3e.c",
        "src/DEV_Config.c",
        "src/RPI_gpiod.c",
        "src/dev_hardware_SPI.c",
        "src/sysfs_gpio.c",
        "src/sysfs_software_spi.c"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "RPI",
        "USE_DEV_LIB"
      ],
      "conditions": [
        ["OS=='linux'", {
          "libraries": [
            "-lgpiod"
          ],
          "cflags": [
            "-std=c99",
            "-Wall",
            "-Wextra"
          ],
          "cflags_cc": [
            "-std=c++14",
            "-Wall",
            "-Wextra"
          ]
        }]
      ]
    }
  ]
}
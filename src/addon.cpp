#include <napi.h>
#include <cstring>
extern "C" {
    #include "EPD_7in3e.h"
    #include "DEV_Config.h"
}

// Initialize the e-Paper module
Napi::Value Init(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (DEV_Module_Init() != 0) {
        Napi::Error::New(env, "Failed to initialize e-Paper module").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    EPD_7IN3E_Init();
    return env.Null();
}

// Clear the display with a specified color
Napi::Value Clear(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected number").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    uint8_t color = info[0].As<Napi::Number>().Uint32Value();
    EPD_7IN3E_Clear(color);
    
    return env.Null();
}

// Display the 7-color block test pattern
Napi::Value Show7Block(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    EPD_7IN3E_Show7Block();
    return env.Null();
}

// Display the color test pattern
Napi::Value Show(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    EPD_7IN3E_Show();
    return env.Null();
}

// Display an image buffer
Napi::Value Display(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!info[0].IsBuffer()) {
        Napi::TypeError::New(env, "Expected buffer").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    
    // Calculate expected buffer size
    uint32_t width = (EPD_7IN3E_WIDTH % 2 == 0) ? (EPD_7IN3E_WIDTH / 2) : (EPD_7IN3E_WIDTH / 2 + 1);
    uint32_t height = EPD_7IN3E_HEIGHT;
    uint32_t expected_size = width * height;
    
    if (buffer.Length() != expected_size) {
        Napi::Error::New(env, "Buffer size mismatch. Expected " + std::to_string(expected_size) + " bytes").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    EPD_7IN3E_Display(buffer.Data());
    return env.Null();
}

// Put the display to sleep
Napi::Value Sleep(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    EPD_7IN3E_Sleep();
    return env.Null();
}

// Exit the module (cleanup)
Napi::Value Exit(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    DEV_Module_Exit();
    return env.Null();
}

// Get display width
Napi::Value GetWidth(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, EPD_7IN3E_WIDTH);
}

// Get display height
Napi::Value GetHeight(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, EPD_7IN3E_HEIGHT);
}

// Get buffer size needed for display
Napi::Value GetBufferSize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    uint32_t width = (EPD_7IN3E_WIDTH % 2 == 0) ? (EPD_7IN3E_WIDTH / 2) : (EPD_7IN3E_WIDTH / 2 + 1);
    uint32_t height = EPD_7IN3E_HEIGHT;
    return Napi::Number::New(env, width * height);
}

// Create a color constants object
Napi::Object CreateColorConstants(Napi::Env env) {
    Napi::Object colors = Napi::Object::New(env);
    colors.Set("BLACK", Napi::Number::New(env, EPD_7IN3E_BLACK));
    colors.Set("WHITE", Napi::Number::New(env, EPD_7IN3E_WHITE));
    colors.Set("YELLOW", Napi::Number::New(env, EPD_7IN3E_YELLOW));
    colors.Set("RED", Napi::Number::New(env, EPD_7IN3E_RED));
    colors.Set("BLUE", Napi::Number::New(env, EPD_7IN3E_BLUE));
    colors.Set("GREEN", Napi::Number::New(env, EPD_7IN3E_GREEN));
    return colors;
}

// Initialize the addon
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    exports.Set("init", Napi::Function::New(env, Init));
    exports.Set("clear", Napi::Function::New(env, Clear));
    exports.Set("show7Block", Napi::Function::New(env, Show7Block));
    exports.Set("show", Napi::Function::New(env, Show));
    exports.Set("display", Napi::Function::New(env, Display));
    exports.Set("sleep", Napi::Function::New(env, Sleep));
    exports.Set("exit", Napi::Function::New(env, Exit));
    exports.Set("getWidth", Napi::Function::New(env, GetWidth));
    exports.Set("getHeight", Napi::Function::New(env, GetHeight));
    exports.Set("getBufferSize", Napi::Function::New(env, GetBufferSize));
    exports.Set("Colors", CreateColorConstants(env));
    
    return exports;
}

NODE_API_MODULE(epd_7in3e_addon, InitAll)
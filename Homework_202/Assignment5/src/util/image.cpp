#include "image.h"

Buffer2D<float> ReadFloatImage(const std::string &filename) {
    int width, height;
    float *buffer = ReadImage(filename, width, height, 1);
    CHECK(buffer != nullptr);
    return Buffer2D<float>(buffer, width, height);
}

Buffer2D<float> ReadFloatImageLayer(const std::string &filename,
                                    const std::string &layername) {
    int width, height;
    float *buffer = ReadImageLayer(filename, layername, width, height, 1);
    CHECK(buffer != nullptr);
    return Buffer2D<float>(buffer, width, height);
}

Buffer2D<Float3> ReadFloat3Image(const std::string &filename) {
    int width, height;
    float *_buffer = ReadImage(filename, width, height, 3);
    CHECK(_buffer != nullptr);
    Float3 *buffer = new Float3[width * height];
    for (int i = 0; i < width * height; i++) {
        buffer[i] = Float3(_buffer[i * 3 + 0], _buffer[i * 3 + 1], _buffer[i * 3 + 2]);
    }
    delete[] _buffer;
    return Buffer2D<Float3>(buffer, width, height);
}

Buffer2D<Float3> ReadFloat3ImageLayer(const std::string &filename,
                                      const std::string &layername) {
    int width, height;
    float *_buffer = ReadImageLayer(filename, layername, width, height, 3);
    CHECK(_buffer != nullptr);
    Float3 *buffer = new Float3[width * height];
    for (int i = 0; i < width * height; i++) {
        buffer[i] = Float3(_buffer[i * 3 + 0], _buffer[i * 3 + 1], _buffer[i * 3 + 2]);
    }
    delete[] _buffer;
    return Buffer2D<Float3>(buffer, width, height);
}

void WriteFloatImage(const Buffer2D<float> &imageBuffer, const std::string &filename) {
    WriteImage(filename, imageBuffer.m_width, imageBuffer.m_height, 1,
               (float *)imageBuffer.m_buffer.get());
}

void WriteFloat3Image(const Buffer2D<Float3> &imageBuffer, const std::string &filename) {
    WriteImage(filename, imageBuffer.m_width, imageBuffer.m_height, 3,
               (float *)imageBuffer.m_buffer.get());
}

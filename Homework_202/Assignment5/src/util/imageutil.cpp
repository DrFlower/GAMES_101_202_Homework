#include "imageutil.h"
#include "common.h"

#define TINYEXR_IMPLEMENTATION
#include "tinyexr/tinyexr.h"

std::string GetExtension(const std::string &s) {
    size_t pos = s.rfind('.');
    CHECK(pos != std::string::npos);
    std::string ext = s.substr(pos + 1);
    return ext;
}

float *ReadImage(const std::string &filename, int &width, int &height,
                 const int &channel) {
    CHECK(channel == 1 || channel == 3);
    std::string ext = GetExtension(filename);
    CHECK(ext == "exr");

    float *out; // width * height * RGBA
    const char *err = nullptr;
    int ret = LoadEXR(&out, &width, &height, filename.c_str(), &err);
    float *buffer = new float[width * height * channel];

    if (ret != TINYEXR_SUCCESS) {
        if (err) {
            fprintf(stderr, "ERR : %s\n", err);
            FreeEXRErrorMessage(err); // release memory of error message.
            delete[] buffer;
            buffer = nullptr;
        }
    } else {
        for (int i = 0; i < width * height; i++) {
            for (int j = 0; j < channel; j++) {
                buffer[i * channel + j] = out[i * 4 + j];
            }
        }
        delete[] out; // release memory of image data
    }
    return buffer;
}

float *ReadImageLayer(const std::string &filename, const std::string &layername,
                      int &width, int &height, const int &channel) {
    CHECK(channel == 1 || channel == 3);
    std::string ext = GetExtension(filename);
    CHECK(ext == "exr");

    float *out; // width * height * RGBA
    const char *err = nullptr;
    int ret = LoadEXRWithLayer(&out, &width, &height, filename.c_str(), layername.c_str(),
                               &err);
    float *buffer = new float[width * height * channel];

    if (ret != TINYEXR_SUCCESS) {
        if (err) {
            fprintf(stderr, "ERR : %s\n", err);
            FreeEXRErrorMessage(err); // release memory of error message.
            delete[] buffer;
            buffer = nullptr;
        }
    } else {
        for (int i = 0; i < width * height; i++) {
            for (int j = 0; j < channel; j++) {
                buffer[i * channel + j] = out[i * 4 + j];
            }
        }
        delete[] out; // release memory of image data
    }
    return buffer;
}

bool WriteImage(const std::string &filename, const int &width, const int &height,
                const int &channel, const float *buffer) {
    CHECK(channel == 1 || channel == 3);
    EXRHeader header;
    InitEXRHeader(&header);

    EXRImage image;
    InitEXRImage(&image);

    image.num_channels = channel;
    std::vector<float> images[3];
    for (int i = 0; i < channel; i++) {
        images[i].resize(width * height);
    }

    // Split RGBRGBRGB... into R, G and B layer
    for (int i = 0; i < width * height; i++) {
        for (int j = 0; j < channel; j++) {
            images[j][i] = buffer[channel * i + j];
        }
    }

    float *image_ptr[3];
    if (channel == 3) {
        image_ptr[0] = &(images[2].at(0)); // B
        image_ptr[1] = &(images[1].at(0)); // G
        image_ptr[2] = &(images[0].at(0)); // R
    } else if (channel == 1) {
        image_ptr[0] = &(images[0].at(0)); // Y
        image_ptr[1] = nullptr;
        image_ptr[2] = nullptr;
    }

    image.images = (unsigned char **)image_ptr;
    image.width = width;
    image.height = height;

    header.num_channels = channel;
    header.channels =
        (EXRChannelInfo *)malloc(sizeof(EXRChannelInfo) * header.num_channels);
    if (header.num_channels == 3) {
        // Must be (A)BGR order, since most of EXR viewers expect this
        // channel order.
        strncpy(header.channels[0].name, "B", 255);
        header.channels[0].name[strlen("B")] = '\0';
        strncpy(header.channels[1].name, "G", 255);
        header.channels[1].name[strlen("G")] = '\0';
        strncpy(header.channels[2].name, "R", 255);
        header.channels[2].name[strlen("R")] = '\0';
    } else if (header.num_channels == 1) {
        strncpy(header.channels[0].name, "Y", 255);
        header.channels[0].name[strlen("Y")] = '\0';
    }

    header.pixel_types = (int *)malloc(sizeof(int) * header.num_channels);
    header.requested_pixel_types = (int *)malloc(sizeof(int) * header.num_channels);
    for (int i = 0; i < header.num_channels; i++) {
        header.pixel_types[i] = TINYEXR_PIXELTYPE_FLOAT; // pixel type of input image
        header.requested_pixel_types[i] =
            TINYEXR_PIXELTYPE_HALF; // pixel type of output image to be
                                    // stored in .EXR
    }

    const char *err = nullptr;
    int ret = SaveEXRImageToFile(&image, &header, filename.c_str(), &err);
    if (ret != TINYEXR_SUCCESS) {
        fprintf(stderr, "Save EXR err: %s\n", err);
        FreeEXRErrorMessage(err); // free's buffer for an error message
        return ret;
    }

    free(header.channels);
    free(header.pixel_types);
    free(header.requested_pixel_types);
    return true;
}

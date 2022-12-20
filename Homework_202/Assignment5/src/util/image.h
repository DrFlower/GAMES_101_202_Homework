#pragma once

#include "buffer.h"
#include "imageutil.h"
#include "mathutil.h"

Buffer2D<float> ReadFloatImage(const std::string &filename);
Buffer2D<float> ReadFloatImageLayer(const std::string &filename,
                                    const std::string &layername);
Buffer2D<Float3> ReadFloat3Image(const std::string &filename);
Buffer2D<Float3> ReadFloat3ImageLayer(const std::string &filename,
                                      const std::string &layername);
void WriteFloatImage(const Buffer2D<float> &imageBuffer, const std::string &filename);
void WriteFloat3Image(const Buffer2D<Float3> &imageBuffer, const std::string &filename);
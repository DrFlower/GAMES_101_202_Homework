#pragma once

#include <string>

float *ReadImage(const std::string &filename, int &width, int &height,
                 const int &channel);

float *ReadImageLayer(const std::string &filename, const std::string &layername,
                      int &width, int &height, const int &channel);

bool WriteImage(const std::string &filename, const int &width, const int &height,
                const int &channel, const float *buffer);
#pragma once

#define NOMINMAX

#include <iostream>

#define LOG(msg)                                                                         \
    std::cout << "[" << __FILE__ << ", " << __FUNCTION__ << ", " << __LINE__             \
              << "]: " << msg << std::endl;

#define CHECK(cond)                                                                      \
    do {                                                                                 \
        if (!(cond)) {                                                                   \
            LOG("Runtime Error.");                                                       \
            exit(-1);                                                                    \
        }                                                                                \
    } while (false)

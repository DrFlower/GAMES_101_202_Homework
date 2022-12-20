#pragma once

#include <cstring>
#include <memory>

#include "common.h"

template <typename T>
class Buffer {
  public:
    Buffer(T *buffer, const int &size);
    virtual void Copy(const Buffer<T> &buffer);

    int m_size;
    std::shared_ptr<T[]> m_buffer = nullptr;
};

template <typename T>
inline Buffer<T>::Buffer(T *buffer, const int &size) : m_buffer(buffer), m_size(size) {}

template <typename T>
inline void Buffer<T>::Copy(const Buffer<T> &buffer) {
    if (m_buffer == buffer.m_buffer) {
        return;
    }
    m_size = buffer.m_size;
    m_buffer = std::shared_ptr<T[]>(new T[m_size]);
    std::memcpy(m_buffer.get(), buffer.m_buffer.get(), sizeof(T) * m_size);
}

template <typename T>
class Buffer2D : public Buffer<T> {
  public:
    Buffer2D();
    Buffer2D(T *buffer, const int &width, const int &height);

    void Copy(const Buffer2D<T> &buffer);

    T operator()(const int &x, const int &y) const;
    T &operator()(const int &x, const int &y);

    int m_width, m_height;
};

template <typename T>
inline Buffer2D<T>::Buffer2D() : Buffer<T>(nullptr, 0), m_width(0), m_height(0) {}

template <typename T>
inline Buffer2D<T>::Buffer2D(T *buffer, const int &width, const int &height)
    : Buffer<T>(buffer, width * height), m_width(width), m_height(height) {}

template <typename T>
inline void Buffer2D<T>::Copy(const Buffer2D<T> &buffer) {
    Buffer<T>::Copy(buffer);
    m_width = buffer.m_width;
    m_height = buffer.m_height;
}

template <typename T>
inline T &Buffer2D<T>::operator()(const int &x, const int &y) {
    CHECK(0 <= x && x < m_width && 0 <= y && y < m_height);
    return this->m_buffer[y * m_width + x];
}

template <typename T>
inline T Buffer2D<T>::operator()(const int &x, const int &y) const {
    if (0 <= x && x < m_width && 0 <= y && y < m_height) {
        return this->m_buffer[y * m_width + x];
    } else {
        return T(0.0);
    }
}

template <typename T>
inline Buffer2D<T> CreateBuffer2D(const int &width, const int &height) {
    T *buffer = new T[width * height];
    return Buffer2D<T>(buffer, width, height);
}
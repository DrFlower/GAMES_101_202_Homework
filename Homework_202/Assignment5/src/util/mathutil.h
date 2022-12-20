#pragma once

#include <cmath>
#include <cstring>

#include "util/common.h"

inline float Sqr(const float &v) { return v * v; }
inline float SafeSqrt(const float &v) { return std::sqrt(std::max(v, 0.f)); }
inline float SafeAcos(const float &v) {
    return std::acos(std::min(std::max(v, 0.f), 1.f));
}

class Float3 {
  public:
    enum EType { Vector, Point };
    Float3(const float &v = 0) : x(v), y(v), z(v) {}
    Float3(const float &_x, const float &_y, const float &_z) : x(_x), y(_y), z(_z) {}
    Float3 operator+(const Float3 &v) const { return Float3(x + v.x, y + v.y, z + v.z); }
    Float3 operator-(const Float3 &v) const { return Float3(x - v.x, y - v.y, z - v.z); }
    Float3 &operator+=(const Float3 &v) {
        x += v.x;
        y += v.y;
        z += v.z;
        return *this;
    }
    Float3 operator*(const float &v) const { return Float3(x * v, y * v, z * v); }
    Float3 operator*(const Float3 &v) const { return Float3(x * v.x, y * v.y, z * v.z); }
    Float3 operator/(const float &v) const {
        CHECK(v != 0.0);
        float inv = 1.0f / v;
        return Float3(x * inv, y * inv, z * inv);
    }
    Float3 operator/(const Float3 &v) const {
        CHECK(v.x != 0.0);
        CHECK(v.y != 0.0);
        CHECK(v.z != 0.0);
        float invX = 1.0f / v.x;
        float invY = 1.0f / v.y;
        float invZ = 1.0f / v.z;
        return Float3(x * invX, y * invY, z * invZ);
    }
    Float3 &operator/=(const float &v) {
        CHECK(v != 0.0);
        float inv = 1.0f / v;
        x *= inv;
        y *= inv;
        z *= inv;
        return *this;
    }

    float x, y, z;
};

inline Float3 Min(const Float3 &a, const Float3 &b) {
    return Float3(std::min(a.x, b.x), std::min(a.y, b.y), std::min(a.z, b.z));
}

inline Float3 Max(const Float3 &a, const Float3 &b) {
    return Float3(std::max(a.x, b.x), std::max(a.y, b.y), std::max(a.z, b.z));
}

inline float Dot(const Float3 &a, const Float3 &b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

inline float AbsSum(const Float3 &a, const Float3 &b) {
    return std::fabs(a.x - b.x) + std::fabs(a.y - b.y) + std::fabs(a.z - b.z);
}

inline Float3 Abs(const Float3 &a) {
    return Float3(std::fabs(a.x), std::fabs(a.y), std::fabs(a.z));
}
inline Float3 Sqr(const Float3 &a) { return Float3(Sqr(a.x), Sqr(a.y), Sqr(a.z)); }
inline Float3 SafeSqrt(const Float3 &a) {
    return Float3(SafeSqrt(a.x), SafeSqrt(a.y), SafeSqrt(a.z));
}

// (1 - s) * u + s * v
inline Float3 Lerp(const Float3 &u, const Float3 &v, const float &s) {
    return u + (v - u) * s;
}
inline Float3 Clamp(const Float3 &v, const Float3 &l, const Float3 &r) {
    return Min(Max(v, l), r);
}

inline float SqrLength(const Float3 &a) { return Sqr(a.x) + Sqr(a.y) + Sqr(a.z); }
inline float Length(const Float3 &a) { return std::sqrt(Sqr(a.x) + Sqr(a.y) + Sqr(a.z)); }
inline Float3 Normalize(const Float3 &a) { return a / Length(a); }

inline float SqrDistance(const Float3 &a, const Float3 &b) { return SqrLength(a - b); }
inline float Distance(const Float3 &a, const Float3 &b) { return Length(a - b); }

inline float Luminance(const Float3 &rgb) {
    return Dot(rgb, Float3(0.2126f, 0.7152f, 0.0722f));
}
inline Float3 RGB2YCoCg(const Float3 &RGB) {
    float Co = RGB.x - RGB.z;
    float tmp = RGB.z + Co / 2;
    float Cg = RGB.y - tmp;
    float Y = tmp + Cg / 2;
    return Float3(Y, Co, Cg);
}
inline Float3 YCoCg2RGB(const Float3 &YCoCg) {
    float tmp = YCoCg.x - YCoCg.z / 2;
    float G = YCoCg.z + tmp;
    float B = tmp - YCoCg.y / 2;
    float R = B + YCoCg.y;
    return Float3(R, G, B);
}

inline std::ostream &operator<<(std::ostream &os, const Float3 &v) {
    os << "[ " << v.x << ", " << v.y << ", " << v.z << " ]";
    return os;
}

class Matrix4x4 {
  public:
    Matrix4x4() {
        memset(m, 0, sizeof(float) * 16);
        m[0][0] = m[1][1] = m[2][2] = m[3][3] = 1;
    }
    Matrix4x4(const float _m[4][4]) { memcpy(m, _m, sizeof(float) * 16); }
    Matrix4x4(const float _m[16]) { memcpy(m, _m, sizeof(float) * 16); }
    Matrix4x4 operator*(const float &v) const {
        Matrix4x4 ret;
        for (uint32_t i = 0; i < 4; i++) {
            for (uint32_t j = 0; j < 4; j++) {
                ret.m[i][j] = m[i][j] * v;
            }
        }
        return ret;
    }
    Matrix4x4 operator/(const float &v) const {
        CHECK(v != 0);
        float inv = 1.f / v;
        return *this * inv;
    }
    Matrix4x4 operator*(const Matrix4x4 &mat) const {
        Matrix4x4 ret;
        for (uint32_t i = 0; i < 4; i++) {
            for (uint32_t j = 0; j < 4; j++) {
                ret.m[i][j] = 0;
                for (uint32_t k = 0; k < 4; k++) {
                    ret.m[i][j] += m[i][k] * mat.m[k][j];
                }
            }
        }
        return ret;
    }
    Float3 operator()(const Float3 &p, const Float3::EType &type) const;

    float m[4][4];

  public:
    friend std::ostream &operator<<(std::ostream &os, const Matrix4x4 &mat) {
        os << mat.m[0][0] << "\t" << mat.m[0][1] << "\t" << mat.m[0][2] << "\t"
           << mat.m[0][3] << "\n"
           << mat.m[1][0] << "\t" << mat.m[1][1] << "\t" << mat.m[1][2] << "\t"
           << mat.m[1][3] << "\n"
           << mat.m[2][0] << "\t" << mat.m[2][1] << "\t" << mat.m[2][2] << "\t"
           << mat.m[2][3] << "\n"
           << mat.m[3][0] << "\t" << mat.m[3][1] << "\t" << mat.m[3][2] << "\t"
           << mat.m[3][3];
        return os;
    }

    friend Matrix4x4 Inverse(const Matrix4x4 &mat);
    friend Matrix4x4 Transpose(const Matrix4x4 &mat);
};
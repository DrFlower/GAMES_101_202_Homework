#include <iostream>
#include <algorithm>   

const float PI = 3.14159265359;

template<typename Type>
struct Vec2 {
    Vec2() = default;

    explicit Vec2(Type x) : x(x), y(x) {}

    Vec2(Type x, Type y) : x(x), y(y) {}

    Vec2 operator+(const Vec2 &b) const {
        return Vec2(x + b.x, y + b.y);
    }

    Vec2 operator-(const Vec2 &b) const {
        return Vec2(x - b.x, y - b.y);
    }

    Vec2 operator*(double b) const {
        return Vec2(x * b, y * b);
    }

    Vec2 operator/(double b) const {
        return Vec2(x / b, y / b);
    }

    Vec2 operator*(const Vec2 &b) const {
        return Vec2(x * b.x, y * b.y);
    }

    Type x, y;
};

template<typename Type>
struct Vec3 {
    Vec3() = default;

    explicit Vec3(Type x) : x(x), y(x), z(x) {}

    Vec3(Type x, Type y, Type z) : x(x), y(y), z(z) {}

    Vec3 operator+(const Vec3 &b) const {
        return Vec3(x + b.x, y + b.y, z + b.z);
    }

    Vec3 operator-(const Vec3 &b) const {
        return Vec3(x - b.x, y - b.y, z - b.z);
    }

    Vec3 operator*(double b) const {
        return Vec3(x * b, y * b, z * b);
    }

    Vec3 operator/(double b) const {
        return Vec3(x / b, y / b, z / b);
    }

    Vec3 operator*(const Vec3 &b) const {
        return Vec3(x * b.x, y * b.y, z * b.z);
    }

    Vec3 &operator+=(const Vec3 &b) {
        x += b.x;
        y += b.y;
        z += b.z;
        return *this;
    }

    Type x, y, z;
};

template<typename Float>
Float dot(Vec3<Float> a, Vec3<Float> b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

template<typename Float>
Vec3<Float> cross(const Vec3<Float> &a, const Vec3<Float> &b) {
    return Vec3<Float>(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}

template<typename Float>
Vec3<Float> normalize(Vec3<Float> a) {
    return a / (std::sqrt(a.x * a.x + a.y * a.y + a.z * a.z));
}

template<typename Float>
Vec3<Float> SphericalToVector(Float mu, Float phi) {
    return Vec3<Float>(std::sin(mu) * std::cos(phi),
                       std::sin(mu) * std::sin(phi),
                       std::cos(mu));
}


template<typename Float>
Vec3<Float> max(const Vec3<Float> &a, const Vec3<Float> &b) {
    return Vec3<Float>(std::max(a.x, b.x),
                       std::max(a.y, b.y),
                       std::max(a.z, b.z));
}

template<typename Float>
Vec3<Float> min(const Vec3<Float> &a, const Vec3<Float> &b) {
    return Vec3<Float>(std::min(a.x, b.x),
                       std::min(a.y, b.y),
                       std::min(a.z, b.z));
}

using Vec3f = Vec3<float>;
using Vec2f = Vec2<float>;
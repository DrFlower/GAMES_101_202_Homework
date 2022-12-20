#include "mathutil.h"

Matrix4x4 Inverse(const Matrix4x4 &mat) {
    float inv[4][4];
    inv[0][0] = +mat.m[1][1] * mat.m[2][2] * mat.m[3][3] +
                mat.m[1][2] * mat.m[2][3] * mat.m[3][1] +
                mat.m[1][3] * mat.m[2][1] * mat.m[3][2] -
                mat.m[1][1] * mat.m[2][3] * mat.m[3][2] -
                mat.m[1][2] * mat.m[2][1] * mat.m[3][3] -
                mat.m[1][3] * mat.m[2][2] * mat.m[3][1];
    inv[1][0] = -mat.m[1][0] * mat.m[2][2] * mat.m[3][3] -
                mat.m[1][2] * mat.m[2][3] * mat.m[3][0] -
                mat.m[1][3] * mat.m[2][0] * mat.m[3][2] +
                mat.m[1][0] * mat.m[2][3] * mat.m[3][2] +
                mat.m[1][2] * mat.m[2][0] * mat.m[3][3] +
                mat.m[1][3] * mat.m[2][2] * mat.m[3][0];
    inv[2][0] = +mat.m[1][0] * mat.m[2][1] * mat.m[3][3] +
                mat.m[1][1] * mat.m[2][3] * mat.m[3][0] +
                mat.m[1][3] * mat.m[2][0] * mat.m[3][1] -
                mat.m[1][0] * mat.m[2][3] * mat.m[3][1] -
                mat.m[1][1] * mat.m[2][0] * mat.m[3][3] -
                mat.m[1][3] * mat.m[2][1] * mat.m[3][0];
    inv[3][0] = -mat.m[1][0] * mat.m[2][1] * mat.m[3][2] -
                mat.m[1][1] * mat.m[2][2] * mat.m[3][0] -
                mat.m[1][2] * mat.m[2][0] * mat.m[3][1] +
                mat.m[1][0] * mat.m[2][2] * mat.m[3][1] +
                mat.m[1][1] * mat.m[2][0] * mat.m[3][2] +
                mat.m[1][2] * mat.m[2][1] * mat.m[3][0];
    inv[0][1] = -mat.m[0][1] * mat.m[2][2] * mat.m[3][3] -
                mat.m[0][2] * mat.m[2][3] * mat.m[3][1] -
                mat.m[0][3] * mat.m[2][1] * mat.m[3][2] +
                mat.m[0][1] * mat.m[2][3] * mat.m[3][2] +
                mat.m[0][2] * mat.m[2][1] * mat.m[3][3] +
                mat.m[0][3] * mat.m[2][2] * mat.m[3][1];
    inv[1][1] = +mat.m[0][0] * mat.m[2][2] * mat.m[3][3] +
                mat.m[0][2] * mat.m[2][3] * mat.m[3][0] +
                mat.m[0][3] * mat.m[2][0] * mat.m[3][2] -
                mat.m[0][0] * mat.m[2][3] * mat.m[3][2] -
                mat.m[0][2] * mat.m[2][0] * mat.m[3][3] -
                mat.m[0][3] * mat.m[2][2] * mat.m[3][0];
    inv[2][1] = -mat.m[0][0] * mat.m[2][1] * mat.m[3][3] -
                mat.m[0][1] * mat.m[2][3] * mat.m[3][0] -
                mat.m[0][3] * mat.m[2][0] * mat.m[3][1] +
                mat.m[0][0] * mat.m[2][3] * mat.m[3][1] +
                mat.m[0][1] * mat.m[2][0] * mat.m[3][3] +
                mat.m[0][3] * mat.m[2][1] * mat.m[3][0];
    inv[3][1] = +mat.m[0][0] * mat.m[2][1] * mat.m[3][2] +
                mat.m[0][1] * mat.m[2][2] * mat.m[3][0] +
                mat.m[0][2] * mat.m[2][0] * mat.m[3][1] -
                mat.m[0][0] * mat.m[2][2] * mat.m[3][1] -
                mat.m[0][1] * mat.m[2][0] * mat.m[3][2] -
                mat.m[0][2] * mat.m[2][1] * mat.m[3][0];
    inv[0][2] = +mat.m[0][1] * mat.m[1][2] * mat.m[3][3] +
                mat.m[0][2] * mat.m[1][3] * mat.m[3][1] +
                mat.m[0][3] * mat.m[1][1] * mat.m[3][2] -
                mat.m[0][1] * mat.m[1][3] * mat.m[3][2] -
                mat.m[0][2] * mat.m[1][1] * mat.m[3][3] -
                mat.m[0][3] * mat.m[1][2] * mat.m[3][1];
    inv[1][2] = -mat.m[0][0] * mat.m[1][2] * mat.m[3][3] -
                mat.m[0][2] * mat.m[1][3] * mat.m[3][0] -
                mat.m[0][3] * mat.m[1][0] * mat.m[3][2] +
                mat.m[0][0] * mat.m[1][3] * mat.m[3][2] +
                mat.m[0][2] * mat.m[1][0] * mat.m[3][3] +
                mat.m[0][3] * mat.m[1][2] * mat.m[3][0];
    inv[2][2] = +mat.m[0][0] * mat.m[1][1] * mat.m[3][3] +
                mat.m[0][1] * mat.m[1][3] * mat.m[3][0] +
                mat.m[0][3] * mat.m[1][0] * mat.m[3][1] -
                mat.m[0][0] * mat.m[1][3] * mat.m[3][1] -
                mat.m[0][1] * mat.m[1][0] * mat.m[3][3] -
                mat.m[0][3] * mat.m[1][1] * mat.m[3][0];
    inv[3][2] = -mat.m[0][0] * mat.m[1][1] * mat.m[3][2] -
                mat.m[0][1] * mat.m[1][2] * mat.m[3][0] -
                mat.m[0][2] * mat.m[1][0] * mat.m[3][1] +
                mat.m[0][0] * mat.m[1][2] * mat.m[3][1] +
                mat.m[0][1] * mat.m[1][0] * mat.m[3][2] +
                mat.m[0][2] * mat.m[1][1] * mat.m[3][0];
    inv[0][3] = -mat.m[0][1] * mat.m[1][2] * mat.m[2][3] -
                mat.m[0][2] * mat.m[1][3] * mat.m[2][1] -
                mat.m[0][3] * mat.m[1][1] * mat.m[2][2] +
                mat.m[0][1] * mat.m[1][3] * mat.m[2][2] +
                mat.m[0][2] * mat.m[1][1] * mat.m[2][3] +
                mat.m[0][3] * mat.m[1][2] * mat.m[2][1];
    inv[1][3] = +mat.m[0][0] * mat.m[1][2] * mat.m[2][3] +
                mat.m[0][2] * mat.m[1][3] * mat.m[2][0] +
                mat.m[0][3] * mat.m[1][0] * mat.m[2][2] -
                mat.m[0][0] * mat.m[1][3] * mat.m[2][2] -
                mat.m[0][2] * mat.m[1][0] * mat.m[2][3] -
                mat.m[0][3] * mat.m[1][2] * mat.m[2][0];
    inv[2][3] = -mat.m[0][0] * mat.m[1][1] * mat.m[2][3] -
                mat.m[0][1] * mat.m[1][3] * mat.m[2][0] -
                mat.m[0][3] * mat.m[1][0] * mat.m[2][1] +
                mat.m[0][0] * mat.m[1][3] * mat.m[2][1] +
                mat.m[0][1] * mat.m[1][0] * mat.m[2][3] +
                mat.m[0][3] * mat.m[1][1] * mat.m[2][0];
    inv[3][3] = +mat.m[0][0] * mat.m[1][1] * mat.m[2][2] +
                mat.m[0][1] * mat.m[1][2] * mat.m[2][0] +
                mat.m[0][2] * mat.m[1][0] * mat.m[2][1] -
                mat.m[0][0] * mat.m[1][2] * mat.m[2][1] -
                mat.m[0][1] * mat.m[1][0] * mat.m[2][2] -
                mat.m[0][2] * mat.m[1][1] * mat.m[2][0];
    float det = mat.m[0][0] * inv[0][0] + mat.m[0][1] * inv[1][0] +
                mat.m[0][2] * inv[2][0] + mat.m[0][3] * inv[3][0];
    return Matrix4x4(inv) / det;
}

Matrix4x4 Transpose(const Matrix4x4 &mat) {
    float m[4][4];
    for (uint32_t i = 0; i < 4; i++) {
        for (uint32_t j = 0; j < 4; j++) {
            m[i][j] = mat.m[j][i];
        }
    }
    return Matrix4x4(m);
}

Float3 Matrix4x4::operator()(const Float3 &p, const Float3::EType &type) const {
    Float3 ret;
    if (type == Float3::Point) {
        float x = m[0][0] * p.x + m[0][1] * p.y + m[0][2] * p.z + m[0][3];
        float y = m[1][0] * p.x + m[1][1] * p.y + m[1][2] * p.z + m[1][3];
        float z = m[2][0] * p.x + m[2][1] * p.y + m[2][2] * p.z + m[2][3];
        float w = m[3][0] * p.x + m[3][1] * p.y + m[3][2] * p.z + m[3][3];
        ret = Float3(x, y, z) / w;
    } else if (type == Float3::Vector) {
        float x = m[0][0] * p.x + m[0][1] * p.y + m[0][2] * p.z;
        float y = m[1][0] * p.x + m[1][1] * p.y + m[1][2] * p.z;
        float z = m[2][0] * p.x + m[2][1] * p.y + m[2][2] * p.z;
        ret = Float3(x, y, z);
    } else {
        CHECK(false);
    }
    return ret;
}

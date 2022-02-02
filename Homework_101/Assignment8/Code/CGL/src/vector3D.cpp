#include "vector3D.h"

namespace CGL {

  std::ostream& operator<<( std::ostream& os, const Vector3D& v ) {
    os << "{ " << v.x << ", " << v.y << ", " << v.z << " }";
    return os;
  }

} // namespace CGL

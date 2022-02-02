#include "complex.h"

namespace CGL {
  
  std::ostream& operator<<( std::ostream& os, const Complex& z ) {
    if( z.y > 0 ) {
       os << z.x << " + " << z.y << "i";
    } else if( z.y < 0 ) {
       os << z.x << " - " << -z.y << "i";
    } else {
       os << z.x;
    }
    return os;
  }

} // namespace CGL

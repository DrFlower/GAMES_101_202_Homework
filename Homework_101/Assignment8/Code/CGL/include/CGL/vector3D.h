#ifndef CGL_VECTOR3D_H
#define CGL_VECTOR3D_H

#include <ostream>
#include <cmath>

namespace CGL {

/**
 * Defines 3D vectors.
 */
class Vector3D {
 public:

  // components
  double x, y, z;

  /**
   * Constructor.
   * Initializes tp vector (0,0,0).
   */
  Vector3D() : x( 0.0 ), y( 0.0 ), z( 0.0 ) { }

  /**
   * Constructor.
   * Initializes to vector (x,y,z).
   */
  Vector3D( double x, double y, double z) : x( x ), y( y ), z( z ) { }

  /**
   * Constructor.
   * Initializes to vector (c,c,c)
   */
  Vector3D( double c ) : x( c ), y( c ), z( c ) { }

  /**
   * Constructor.
   * Initializes from existing vector
   */
  Vector3D( const Vector3D& v ) : x( v.x ), y( v.y ), z( v.z ) { }

  // returns reference to the specified component (0-based indexing: x, y, z)
  inline double& operator[] ( const int& index ) {
    return ( &x )[ index ];
  }

  // returns const reference to the specified component (0-based indexing: x, y, z)
  inline const double& operator[] ( const int& index ) const {
    return ( &x )[ index ];
  }

  // negation
  inline Vector3D operator-( void ) const {
    return Vector3D( -x, -y, -z );
  }

  // addition
  inline Vector3D operator+( const Vector3D& v ) const {
    return Vector3D( x + v.x, y + v.y, z + v.z );
  }

  // subtraction
  inline Vector3D operator-( const Vector3D& v ) const {
    return Vector3D( x - v.x, y - v.y, z - v.z );
  }

  // right scalar multiplication
  inline Vector3D operator*( const double& c ) const {
    return Vector3D( x * c, y * c, z * c );
  }

  // scalar division
  inline Vector3D operator/( const double& c ) const {
    const double rc = 1.0/c;
    return Vector3D( rc * x, rc * y, rc * z );
  }

  // addition / assignment
  inline void operator+=( const Vector3D& v ) {
    x += v.x; y += v.y; z += v.z;
  }

  // subtraction / assignment
  inline void operator-=( const Vector3D& v ) {
    x -= v.x; y -= v.y; z -= v.z;
  }

  // scalar multiplication / assignment
  inline void operator*=( const double& c ) {
    x *= c; y *= c; z *= c;
  }

  // scalar division / assignment
  inline void operator/=( const double& c ) {
    (*this) *= ( 1./c );
  }

  /**
   * Returns Euclidean length.
   */
  inline double norm( void ) const {
    return sqrt( x*x + y*y + z*z );
  }

  /**
   * Returns Euclidean length squared.
   */
  inline double norm2( void ) const {
    return x*x + y*y + z*z;
  }

  /**
   * Returns unit vector.
   */
  inline Vector3D unit( void ) const {
    double rNorm = 1. / sqrt( x*x + y*y + z*z );
    return Vector3D( rNorm*x, rNorm*y, rNorm*z );
  }

  /**
   * Divides by Euclidean length.
   */
  inline void normalize( void ) {
    (*this) /= norm();
  }

}; // class Vector3D

// left scalar multiplication
inline Vector3D operator* ( const double& c, const Vector3D& v ) {
  return Vector3D( c * v.x, c * v.y, c * v.z );
}

// dot product (a.k.a. inner or scalar product)
inline double dot( const Vector3D& u, const Vector3D& v ) {
  return u.x*v.x + u.y*v.y + u.z*v.z ;
}

// cross product
inline Vector3D cross( const Vector3D& u, const Vector3D& v ) {
  return Vector3D( u.y*v.z - u.z*v.y,
                   u.z*v.x - u.x*v.z,
                   u.x*v.y - u.y*v.x );
}

// prints components
std::ostream& operator<<( std::ostream& os, const Vector3D& v );

} // namespace CGL

#endif // CGL_VECTOR3D_H

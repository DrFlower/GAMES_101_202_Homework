#ifndef CGL_COMPLEX_H
#define CGL_COMPLEX_H

#include "vector2D.h"

namespace CGL {

/**
* Represents complex numbers as 2D vectors of their real and
* imaginary components.
*/
class Complex : public Vector2D {
 public:

  /**
   * Constructor.
   * Initializes to 0.
   */
  Complex( ) : Vector2D( 0.0, 0.0 ) { }

  /**
   * Constructor.
   * Initializes to a+bi.
   */
  Complex( double a, double b ) : Vector2D( a, b ) { }

  /**
   * Constructor.
   * Initializes to a+bi from vector v = (a,b)
   */
  Complex( const Vector2D& v ) : Vector2D( v ) { }

  /**
   * Compute the complex conjugate.
   */
  inline Complex conj( ) const {
    return Complex( x, -y );
  }

  /**
   * Compute the inverse.
   */
  inline Complex inv( ) const {
    double r = 1.0/norm2();
    return Complex( r*x, -r*y );
  }

  /**
   * Return argument.
   */
  inline double arg( ) const {
    return atan2( y, x );
  }

  /**
   * Complex exponentiation.
   */
  inline Complex exponential( ) const {
    return exp( x ) * Complex( cos( y ), sin( y ));
  }

  // Complex multiply by z
  inline void operator*=( const Complex& z ) {
    double a = x;
    double b = y;
    double c = z.x;
    double d = z.y;
    x = a*c-b*d;
    y = a*d+b*c;
  }

  // complex divide by z
  void operator/=( const Complex& z ) {
    *this *= z.inv();
  }

}; // class Complex

// returns the real part of z
double Re( const Complex& z );

// returns the imaginary part of z
double Im( const Complex& z );

// binary Complex multiplication
inline Complex operator*( const Complex& z1, const Complex& z2 ) {
    Complex z = z1;
    z *= z2;
    return z;
}

// complex division
inline Complex operator/( const Complex& z1, const Complex& z2 ) {
    Complex z = z1;
    z /= z2;
    return z;
}

// prints components
std::ostream& operator<<( std::ostream& os, const Complex& z );

} // namespace CGL

#endif // CGL_COMPLEX_H

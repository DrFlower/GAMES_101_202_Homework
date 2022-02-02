#include "matrix4x4.h"

#include <iostream>
#include <cmath>

using namespace std;

namespace CGL {

  double& Matrix4x4::operator()( int i, int j ) {
    return entries[j][i];
  }

  const double& Matrix4x4::operator()( int i, int j ) const {
    return entries[j][i];
  }

  Vector4D& Matrix4x4::operator[]( int j ) {
      return entries[j];
  }

  const Vector4D& Matrix4x4::operator[]( int j ) const {
    return entries[j];
  }

  void Matrix4x4::zero( double val ) {
    // sets all elements to val
    entries[0] =
	  entries[1] =
	  entries[2] =
	  entries[3] = Vector4D( val, val, val, val );
  }

  double Matrix4x4::det( void ) const {
    const Matrix4x4& A( *this );

	return
	  A(0,3)*A(1,2)*A(2,1)*A(3,0) - A(0,2)*A(1,3)*A(2,1)*A(3,0) -
	  A(0,3)*A(1,1)*A(2,2)*A(3,0) + A(0,1)*A(1,3)*A(2,2)*A(3,0) +
	  A(0,2)*A(1,1)*A(2,3)*A(3,0) - A(0,1)*A(1,2)*A(2,3)*A(3,0) -
	  A(0,3)*A(1,2)*A(2,0)*A(3,1) + A(0,2)*A(1,3)*A(2,0)*A(3,1) +
	  A(0,3)*A(1,0)*A(2,2)*A(3,1) - A(0,0)*A(1,3)*A(2,2)*A(3,1) -
	  A(0,2)*A(1,0)*A(2,3)*A(3,1) + A(0,0)*A(1,2)*A(2,3)*A(3,1) +
	  A(0,3)*A(1,1)*A(2,0)*A(3,2) - A(0,1)*A(1,3)*A(2,0)*A(3,2) -
	  A(0,3)*A(1,0)*A(2,1)*A(3,2) + A(0,0)*A(1,3)*A(2,1)*A(3,2) +
	  A(0,1)*A(1,0)*A(2,3)*A(3,2) - A(0,0)*A(1,1)*A(2,3)*A(3,2) -
	  A(0,2)*A(1,1)*A(2,0)*A(3,3) + A(0,1)*A(1,2)*A(2,0)*A(3,3) +
	  A(0,2)*A(1,0)*A(2,1)*A(3,3) - A(0,0)*A(1,2)*A(2,1)*A(3,3) -
	  A(0,1)*A(1,0)*A(2,2)*A(3,3) + A(0,0)*A(1,1)*A(2,2)*A(3,3);

  }

  double Matrix4x4::norm( void ) const {
    return sqrt( entries[0].norm2() +
                 entries[1].norm2() +
                 entries[2].norm2() +
				         entries[3].norm2());
  }

  Matrix4x4 Matrix4x4::operator-( void ) const {

  // returns -A (Negation).
  const Matrix4x4& A( *this );
  Matrix4x4 B;

  B(0,0) = -A(0,0); B(0,1) = -A(0,1); B(0,2) = -A(0,2); B(0,3) = -A(0,3);
  B(1,0) = -A(1,0); B(1,1) = -A(1,1); B(1,2) = -A(1,2); B(1,3) = -A(1,3);
  B(2,0) = -A(2,0); B(2,1) = -A(2,1); B(2,2) = -A(2,2); B(2,3) = -A(2,3);
	B(3,0) = -A(3,0); B(3,1) = -A(3,1); B(3,2) = -A(3,2); B(3,3) = -A(3,3);

    return B;
  }

  void Matrix4x4::operator+=( const Matrix4x4& B ) {

    Matrix4x4& A( *this );
    double* Aij = (double*) &A;
    const double* Bij = (const double*) &B;

    // Add the 16 contigous vector packed double values.
    *Aij++ += *Bij++;//0
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;//4
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;//8
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;//12
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;
    *Aij++ += *Bij++;//15
	//16.

  }

  Matrix4x4 Matrix4x4::operator+( const Matrix4x4& B ) const {
    const Matrix4x4& A( *this );
    Matrix4x4 C;

    for( int i = 0; i < 4; i++ )
    for( int j = 0; j < 4; j++ )
    {
       C(i,j) = A(i,j) + B(i,j);
    }

    return C;
  }


  Matrix4x4 Matrix4x4::operator-( const Matrix4x4& B ) const {
    const Matrix4x4& A( *this );
    Matrix4x4 C;

    for( int i = 0; i < 4; i++ )
    for( int j = 0; j < 4; j++ )
    {
       C(i,j) = A(i,j) - B(i,j);
    }

    return C;
  }

  Matrix4x4 Matrix4x4::operator*( double c ) const {
    const Matrix4x4& A( *this );
    Matrix4x4 B;

    for( int i = 0; i < 4; i++ )
    for( int j = 0; j < 4; j++ )
    {
       B(i,j) = c*A(i,j);
    }

    return B;
  }

  // Returns c*A.
  Matrix4x4 operator*( double c, const Matrix4x4& A ) {

    Matrix4x4 cA;
    const double* Aij = (const double*) &A;
    double* cAij = (double*) &cA;

    *cAij++ = c * (*Aij++);//0
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);//4
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);//8
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);//12
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);
    *cAij++ = c * (*Aij++);//15
	//16
    return cA;
  }

  // Tradiational Grade School Multiplication. N^3
  Matrix4x4 Matrix4x4::operator*( const Matrix4x4& B ) const {
    const Matrix4x4& A( *this );
    Matrix4x4 C;

    for( int i = 0; i < 4; i++ )
    for( int j = 0; j < 4; j++ )
    {
       C(i,j) = 0.;

       for( int k = 0; k < 4; k++ )
       {
          C(i,j) += A(i,k)*B(k,j);
       }
    }

    return C;
  }


  Vector4D Matrix4x4::operator*( const Vector4D& x ) const {
    return x[0]*entries[0] + // Add up products for each matrix column.
           x[1]*entries[1] +
           x[2]*entries[2] +
           x[3]*entries[3];
  }

  // Naive Transposition.
  Matrix4x4 Matrix4x4::T( void ) const {
    const Matrix4x4& A( *this );
    Matrix4x4 B;

    for( int i = 0; i < 4; i++ )
    for( int j = 0; j < 4; j++ )
    {
       B(i,j) = A(j,i);
    }

    return B;
  }

  Matrix4x4 Matrix4x4::inv( void ) const {
    const Matrix4x4& A( *this );
    Matrix4x4 B;

	// Hardcoded in Fully Symbolic computation.

	B(0,0) = A(1,2)*A(2,3)*A(3,1) - A(1,3)*A(2,2)*A(3,1) + A(1,3)*A(2,1)*A(3,2) - A(1,1)*A(2,3)*A(3,2) - A(1,2)*A(2,1)*A(3,3) + A(1,1)*A(2,2)*A(3,3);
	B(0,1) = A(0,3)*A(2,2)*A(3,1) - A(0,2)*A(2,3)*A(3,1) - A(0,3)*A(2,1)*A(3,2) + A(0,1)*A(2,3)*A(3,2) + A(0,2)*A(2,1)*A(3,3) - A(0,1)*A(2,2)*A(3,3);
	B(0,2) = A(0,2)*A(1,3)*A(3,1) - A(0,3)*A(1,2)*A(3,1) + A(0,3)*A(1,1)*A(3,2) - A(0,1)*A(1,3)*A(3,2) - A(0,2)*A(1,1)*A(3,3) + A(0,1)*A(1,2)*A(3,3);
	B(0,3) = A(0,3)*A(1,2)*A(2,1) - A(0,2)*A(1,3)*A(2,1) - A(0,3)*A(1,1)*A(2,2) + A(0,1)*A(1,3)*A(2,2) + A(0,2)*A(1,1)*A(2,3) - A(0,1)*A(1,2)*A(2,3);
	B(1,0) = A(1,3)*A(2,2)*A(3,0) - A(1,2)*A(2,3)*A(3,0) - A(1,3)*A(2,0)*A(3,2) + A(1,0)*A(2,3)*A(3,2) + A(1,2)*A(2,0)*A(3,3) - A(1,0)*A(2,2)*A(3,3);
	B(1,1) = A(0,2)*A(2,3)*A(3,0) - A(0,3)*A(2,2)*A(3,0) + A(0,3)*A(2,0)*A(3,2) - A(0,0)*A(2,3)*A(3,2) - A(0,2)*A(2,0)*A(3,3) + A(0,0)*A(2,2)*A(3,3);
	B(1,2) = A(0,3)*A(1,2)*A(3,0) - A(0,2)*A(1,3)*A(3,0) - A(0,3)*A(1,0)*A(3,2) + A(0,0)*A(1,3)*A(3,2) + A(0,2)*A(1,0)*A(3,3) - A(0,0)*A(1,2)*A(3,3);
	B(1,3) = A(0,2)*A(1,3)*A(2,0) - A(0,3)*A(1,2)*A(2,0) + A(0,3)*A(1,0)*A(2,2) - A(0,0)*A(1,3)*A(2,2) - A(0,2)*A(1,0)*A(2,3) + A(0,0)*A(1,2)*A(2,3);
	B(2,0) = A(1,1)*A(2,3)*A(3,0) - A(1,3)*A(2,1)*A(3,0) + A(1,3)*A(2,0)*A(3,1) - A(1,0)*A(2,3)*A(3,1) - A(1,1)*A(2,0)*A(3,3) + A(1,0)*A(2,1)*A(3,3);
	B(2,1) = A(0,3)*A(2,1)*A(3,0) - A(0,1)*A(2,3)*A(3,0) - A(0,3)*A(2,0)*A(3,1) + A(0,0)*A(2,3)*A(3,1) + A(0,1)*A(2,0)*A(3,3) - A(0,0)*A(2,1)*A(3,3);
	B(2,2) = A(0,1)*A(1,3)*A(3,0) - A(0,3)*A(1,1)*A(3,0) + A(0,3)*A(1,0)*A(3,1) - A(0,0)*A(1,3)*A(3,1) - A(0,1)*A(1,0)*A(3,3) + A(0,0)*A(1,1)*A(3,3);
	B(2,3) = A(0,3)*A(1,1)*A(2,0) - A(0,1)*A(1,3)*A(2,0) - A(0,3)*A(1,0)*A(2,1) + A(0,0)*A(1,3)*A(2,1) + A(0,1)*A(1,0)*A(2,3) - A(0,0)*A(1,1)*A(2,3);
	B(3,0) = A(1,2)*A(2,1)*A(3,0) - A(1,1)*A(2,2)*A(3,0) - A(1,2)*A(2,0)*A(3,1) + A(1,0)*A(2,2)*A(3,1) + A(1,1)*A(2,0)*A(3,2) - A(1,0)*A(2,1)*A(3,2);
	B(3,1) = A(0,1)*A(2,2)*A(3,0) - A(0,2)*A(2,1)*A(3,0) + A(0,2)*A(2,0)*A(3,1) - A(0,0)*A(2,2)*A(3,1) - A(0,1)*A(2,0)*A(3,2) + A(0,0)*A(2,1)*A(3,2);
	B(3,2) = A(0,2)*A(1,1)*A(3,0) - A(0,1)*A(1,2)*A(3,0) - A(0,2)*A(1,0)*A(3,1) + A(0,0)*A(1,2)*A(3,1) + A(0,1)*A(1,0)*A(3,2) - A(0,0)*A(1,1)*A(3,2);
	B(3,3) = A(0,1)*A(1,2)*A(2,0) - A(0,2)*A(1,1)*A(2,0) + A(0,2)*A(1,0)*A(2,1) - A(0,0)*A(1,2)*A(2,1) - A(0,1)*A(1,0)*A(2,2) + A(0,0)*A(1,1)*A(2,2);

	// Invertable iff the determinant is not equal to zero.
    B /= det();

    return B;
  }

  void Matrix4x4::operator/=( double x ) {
    Matrix4x4& A( *this );
    double rx = 1./x;

    for( int i = 0; i < 4; i++ )
    for( int j = 0; j < 4; j++ )
    {
       A( i, j ) *= rx;
    }
  }

  Matrix4x4 Matrix4x4::identity( void ) {
    Matrix4x4 B;

    B(0,0) = 1.; B(0,1) = 0.; B(0,2) = 0.; B(0,3) = 0.;
    B(1,0) = 0.; B(1,1) = 1.; B(1,2) = 0.; B(1,3) = 0.;
    B(2,0) = 0.; B(2,1) = 0.; B(2,2) = 1.; B(2,3) = 0.;
    B(3,0) = 0.; B(3,1) = 0.; B(3,2) = 0.; B(3,3) = 1.;

    return B;
  }

  Matrix4x4 outer( const Vector4D& u, const Vector4D& v ) {
    Matrix4x4 B;

    // Opposite of an inner product.
    for( int i = 0; i < 4; i++ )
    for( int j = 0; j < 4; j++ )
    {
       B( i, j ) = u[i]*v[j];
    }

    return B;
  }

  std::ostream& operator<<( std::ostream& os, const Matrix4x4& A ) {
    for( int i = 0; i < 4; i++ )
    {
       os << "[ ";

       for( int j = 0; j < 4; j++ )
       {
          os << A(i,j) << " ";
       }

       os << "]" << std::endl;
    }

    return os;
  }

  Vector4D& Matrix4x4::column( int i ) {
    return entries[i];
  }

  const Vector4D& Matrix4x4::column( int i ) const {
    return entries[i];
  }
}

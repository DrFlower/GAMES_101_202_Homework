#ifndef CGL_QUATERNION_H
#define CGL_QUATERNION_H

#include <iosfwd>
#include "vector4D.h"
#include "vector3D.h"
#include "matrix4x4.h"
#include "matrix3x3.h"

/*
 * Quarternion Class
 *
 * Written By Bryce Summers on 9/10/2015.
 *
 * Adapted from a stanford researcher's quaternion class found at:
 * http://www.cs.stanford.edu/~acoates/quaternion.h
 * 15-462 at Carnegie Mellon University.
 */


namespace CGL {

class Quaternion : public Vector4D {

 private:

  // A clamp function.
  static inline double saturate(double x, double min_val, double max_val)
  {
	return std::max(min_val, std::min(max_val, x));
  }


 public:

  /**
   * Constructor.
   * Initializes to 0,0,0,1
   */
  Quaternion( ) : Vector4D( 0.0, 0.0, 0.0, 1.0 ) { }

  /*
   * Construct from 3D vector and w.
   *
   */
  Quaternion(const Vector3D& v, double w) : Vector4D(v.x, v.y, v.z, w) { }

  Quaternion(const Vector4D& v) : Vector4D(v.x, v.y, v.z, v.w) { }

  Quaternion(double x, double y, double z, double w) : Vector4D(x, y, z, w) { }

  Vector3D complex() const { return Vector3D(x, y, z); }
  void setComplex(const Vector3D& c)
  {
	x = c.x;
	y = c.y;
	z = c.z;
  }

  double real() const { return w; }
  void setReal(double r) { w = r; }

  Quaternion conjugate(void) const
  {
	return Quaternion(-complex(), real());
  }

  /**
   * @brief Computes the inverse of this quaternion.
   *
   * @note This is a general inverse.  If you know a priori
   * that you're using a unit quaternion (i.e., norm() == 1),
   * it will be significantly faster to use conjugate() instead.
   *
   * @return The quaternion q such that q * (*this) == (*this) * q
   * == [ 0 0 0 1 ]<sup>T</sup>.
   */
  Quaternion inverse(void) const
  {
	return conjugate() / norm();
  }


  /**
   * @brief Computes the product of this quaternion with the
   * quaternion 'rhs'.
   *
   * @param rhs The right-hand-side of the product operation.
   *
   * @return The quaternion product (*this) x @p rhs.
   */
  Quaternion product(const Quaternion& rhs) const {
	return Quaternion(y*rhs.z - z*rhs.y + x*rhs.w + w*rhs.x,
					  z*rhs.x - x*rhs.z + y*rhs.w + w*rhs.y,
					  x*rhs.y - y*rhs.x + z*rhs.w + w*rhs.z,
					  w*rhs.w - x*rhs.x - y*rhs.y - z*rhs.z);
  }

  /**
   * @brief Quaternion product operator.
   *
   * The result is a quaternion such that:
   *
   * result.real() = (*this).real() * rhs.real() -
   * (*this).complex().dot(rhs.complex());
   *
   * and:
   *
   * result.complex() = rhs.complex() * (*this).real
   * + (*this).complex() * rhs.real()
   * - (*this).complex().cross(rhs.complex());
   *
   * @return The quaternion product (*this) x rhs.
   */
  Quaternion operator*(const Quaternion& rhs) const {
	return product(rhs);
  }

  /**
   * @brief Returns a matrix representation of this
   * quaternion.
   *
   * Specifically this is the matrix such that:
   *
   * this->matrix() * q.vector() = (*this) * q for any quaternion q.
   *
   * Note that this is @e NOT the rotation matrix that may be
   * represented by a unit quaternion.
   */
  Matrix4x4 matrix() const {

	double m[16] = {
	   w,  -z,  y, x,
	   z,   w, -x, y,
	  -y,   x,  w, z,
	  -x,  -y, -z, w
	};

	return Matrix4x4(m);
  }

  /**
   * @brief Returns a matrix representation of this
   * quaternion for right multiplication.
   *
   * Specifically this is the matrix such that:
   *
   * q.vector().transpose() * this->matrix() = (q *
   * (*this)).vector().transpose() for any quaternion q.
   *
   * Note that this is @e NOT the rotation matrix that may be
   * represented by a unit quaternion.
   */
  Matrix4x4 rightMatrix() const {
	double m[16] = {
	  +w, -z,  y, -x,
	  +z,  w, -x, -y,
	  -y,  x,  w, -z,
	  +x,  y,  z,  w
	};

	return Matrix4x4(m);
  }

  /**
   * @brief Returns this quaternion as a 4-vector.
   *
   * This is simply the vector [x y z w]<sup>T</sup>
   */
  Vector4D vector() const { return Vector4D(x, y, z, w); }

  /**
   * @brief Computes the rotation matrix represented by a unit
   * quaternion.
   *
   * @note This does not check that this quaternion is normalized.
   * It formulaically returns the matrix, which will not be a
   * rotation if the quaternion is non-unit.
   */
  Matrix3x3 rotationMatrix() const {
	double m[9] = {
	  1-2*y*y-2*z*z, 2*x*y - 2*z*w, 2*x*z + 2*y*w,
	  2*x*y + 2*z*w, 1-2*x*x-2*z*z, 2*y*z - 2*x*w,
	  2*x*z - 2*y*w, 2*y*z + 2*x*w, 1-2*x*x-2*y*y
	};

	return Matrix3x3(m);
  }


    /**
     * @brief Returns the scaled-axis representation of this
     * quaternion rotation.
     */
  Vector3D scaledAxis(void) const{

	Quaternion q1 = (Quaternion)unit();

	// Algorithm from http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/

	double angle = 2 * acos(q1.w);

	// s must be positive, because q1 <= 1, due to normalization.
	double s = sqrt(1-q1.w*q1.w);

	// Avoid dividing by 0.
	if (s < 0.001)
	{
	  // if s close to zero then direction of axis not important
	  // if it is important that axis is normalised then replace with x=1; y=z=0;

	  return Vector3D(q1.x, q1.y, q1.z);
	}
	else
	{
	  // normalise axis
	  return Vector3D(q1.x / s, q1.y / s, q1.z / s);
	}

	// NEVER getsgg HERE.

  }

  /**
   * @brief Sets quaternion to be same as rotation by scaled axis w.
   * This is the equal and opposite conversion from the scaledAxis(void) function.
   */
  void scaledAxis(const Vector3D& vec_in)
  {
	double theta = vec_in.norm();

	// Small magnitudes are handled via the default vector.
	if (theta > 0.0001)
	{
	  double s = sin(theta / 2.0);
	  Vector3D W(vec_in / theta * s);
	  x = W.x;
	  y = W.y;
	  z = W.z;
	  w = cos(theta / 2.0);
	}
	else
	{
	  x = y = z = 0;
	  w = 1.0;
	}
  }

  /**
   * @brief Returns a vector rotated by this quaternion.
   *
   * Functionally equivalent to:  (rotationMatrix() * v)
   * or (q * Quaternion(0, v) * q.inverse()).
   *
   * @warning conjugate() is used instead of inverse() for better
   * performance, when this quaternion must be normalized.
   */
  Vector3D rotatedVector(const Vector3D& v) const {
	return (((*this) * Quaternion(v, 0)) * conjugate()).complex();
  }



  /**
   * @brief Computes and sets this quaternion that is equivalent to a given
   * euler angle rotation.
   * @param euler A 3-vector in order:  roll-pitch-yaw.
   */
  void euler(const Vector3D& euler) {
	double c1 = cos(euler[2] * 0.5);
	double c2 = cos(euler[1] * 0.5);
	double c3 = cos(euler[0] * 0.5);
	double s1 = sin(euler[2] * 0.5);
	double s2 = sin(euler[1] * 0.5);
	double s3 = sin(euler[0] * 0.5);

	x = c1*c2*s3 - s1*s2*c3;
	y = c1*s2*c3 + s1*c2*s3;
	z = s1*c2*c3 - c1*s2*s3;
	w = c1*c2*c3 + s1*s2*s3;
  }

  /** @brief Returns an equivalent euler angle representation of
   * this quaternion.
   * @return Euler angles in roll-pitch-yaw order.
   */
  Vector3D euler(void) const
  {
	Vector3D euler;
	const static double PI_OVER_2 = M_PI * 0.5;
	const static double EPSILON = 1e-10;
	double sqw, sqx, sqy, sqz;

	// quick conversion to Euler angles to give tilt to user
	sqw = w*w;
	sqx = x*x;
	sqy = y*y;
	sqz = z*z;

	euler[1] = asin(2.0 * (w*y - x*z));
	if (PI_OVER_2 - fabs(euler[1]) > EPSILON) {
	  euler[2] = atan2(2.0 * (x*y + w*z),
					   sqx - sqy - sqz + sqw);
	  euler[0] = atan2(2.0 * (w*x + y*z),
					   sqw - sqx - sqy + sqz);
	}
	else
	{
	  // compute heading from local 'down' vector
	  euler[2] = atan2(2*y*z - 2*x*w,
					   2*x*z + 2*y*w);
	  euler[0] = 0.0;

	  // If facing down, reverse yaw
	  if (euler[1] < 0)
	  {
		euler[2] = M_PI - euler[2];
	  }
	}

	return euler;
  }

  /**
   * @brief Computes a special representation that decouples the Z
   * rotation.
   *
   * The decoupled representation is two rotations, Qxy and Qz,
   * so that Q = Qxy * Qz.
   */
  void decoupleZ(Quaternion* Qxy, Quaternion* Qz) const {
	Vector3D ztt(0,0,1);
	Vector3D zbt = this->rotatedVector(ztt);
	Vector3D axis_xy = cross(ztt, zbt);
	double axis_norm = axis_xy.norm();

	// FIXME::Bryce has no clue what saturate is suppose to do...
	double axis_theta = acos(saturate(zbt.z, -1,+1));
	if (axis_norm > 0.00001)
	{
	  axis_xy = axis_xy * (axis_theta/axis_norm); // limit is *1
	}

	Qxy->scaledAxis(axis_xy);
	*Qz = (Qxy->conjugate() * (*this));
  }

  /**
   * @brief Returns the quaternion slerped between this and q1 by fraction 0 <= t <= 1.
   * Bryce Likes the sound of this.
   */
  Quaternion slerp(const Quaternion& q1, double t)
  {
    return slerp(*this, q1, t);
  }

  /// Returns quaternion that is slerped by fraction 't' between q0 and q1.
  static Quaternion slerp(const Quaternion& q0, const Quaternion& q1, double t) {

    double omega = acos(saturate(q0.x*q1.x +
								 q0.y*q1.y +
								 q0.z*q1.z +
								 q0.w*q1.w, -1,1));
    if (fabs(omega) < 1e-10)
	{
      omega = 1e-10;
    }
    double som = sin(omega);
    double st0 = sin((1-t) * omega) / som;
    double st1 = sin(t * omega) / som;

    return Quaternion(q0.x*st0 + q1.x*st1,
                      q0.y*st0 + q1.y*st1,
                      q0.z*st0 + q1.z*st1,
                      q0.w*st0 + q1.w*st1);
  }


};

/**
 * @brief Global operator allowing left-multiply by scalar.
 */
Quaternion operator*(double s, const Quaternion& q);

} // namespace CGL

#endif /* CGL_QUATERNION_H */

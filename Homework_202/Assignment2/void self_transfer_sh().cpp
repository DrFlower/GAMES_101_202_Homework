// http://www.cse.chalmers.se/~uffe/xjobb/Readings/GlobalIllumination/Spherical%20Harmonic%20Lighting%20-%20the%20gritty%20details.pdf 34页


void self_transfer_sh()
{
 const double area = 4.0*PI;
 double *sh_buffer[n_bounces+1]; // list of light bounce buffers.
 // allocate and clear buffers for self transferred light
 sh_buffer[0] = sh_coeff; // already calculated from direct lighting
 for(int i=1; i<=n_bounces; ++i) {
    sh_buffer[i] = new double[n_lighting * 3 * n_coeff];
    memset(sh_buffer[i], 0, n_lighting*3*n_coeff*sizeof(double));
 }
 // for each bounce of light
 for(int bounce=1; bounce<=n_bounces; ++bounce) {
    // loop through all lighting points redistributing self light
    for(int i=0; i<n_lighting; ++i) {
        // find rays that hit self
        bitvector::iterator j;
        int n = 0;
        double u = 0.0, v = 0.0, w = 0.0;
        Face *fptr = 0;
        double sh[3*n_coeff];
        // get the surface albedo of the lighting point.
        double albedo_red = mlist[plist[i].material].kd.x / PI;
        double albedo_green = mlist[plist[i].material].kd.y / PI;
        double albedo_blue = mlist[plist[i].material].kd.z / PI;
        // loop through boolean vector looking for a ray that hits self…
        for(j=hit_self[i].begin(); j!=hit_self[i].end(); ++n,++j) {
            if(*j) {
                // calc H cosine term about surface normal
                float Hs = DotProduct(sample[n].vec, plist[i].norm);
                // if ray inside hemisphere, continue processing.
                if(Hs > 0.0) {
                    // trace ray to find tri and (u,v,w) barycentric coords of hit
                    u = v = w = 0.0;
                    fptr = 0;
                    bool ret = raytrace_closest_triangle(plist[i].pos,
                    sample[n].vec,
                    face_ptr, u, v);
                    // if (surprise, surprise) the ray hits something...
                    if(ret) {
                        // lerp vertex SH vector to get SH at hit point
                        w = 1.0 - (u+v);
                        double *ptr0 = sh_buffer[bounce-1] +
                        face_ptr->vert[0]*3*n_coeff;
                        double *ptr1 = sh_buffer[bounce-1] +
                        face_ptr->vert[1]*3*n_coeff;
                        double *ptr2 = sh_buffer[bounce-1] +
                        face_ptr->vert[2]*3*n_coeff;
                        for(int k=0; k<3*n_coeff; ++k) {
                            sh[k] = u*(*ptr0++) + v*(*ptr1++) + w*(*ptr2++);
                        }
                        // sum reflected SH light for this vertex
                        for(k=0; k<n_coeff; ++k) {
                            sh_buffer[bounce][i*3*n_coeff + k+0*n_coeff] +=
                            albedo_red * Hs * sh[k+0*n_coeff];
                            sh_buffer[bounce][i*3*n_coeff + k+1*n_coeff] +=
                            albedo_green * Hs * sh[k+1*n_coeff];
                            sh_buffer[bounce][i*3*n_coeff + k+2*n_coeff] +=
                            albedo_blue * Hs * sh[k+2*n_coeff];
                        }
                    } // ray test
                } // hemisphere test
            } // hit self bit is true
        } // loop for bool vector
    } // each lighting point
    // divide through by n_samples
    const double factor = area / n_samples;
    double *ptr = sh_buffer[bounce];
    for(int j=0; j<n_lighting * 3 * n_coeff; ++j)
    *ptr++ *= factor;
 }
}

  // loop over all bounces
 // sum all bounces of self transferred light back into sh_coeff
for(i=1; i<=n_bounces; ++i) {
    double *ptra = sh_buffer[0];
    double *ptrb = sh_buffer[i];
    for(int j=0; j<n_lighting * 3 * n_coeff; ++j)
        *ptra++ += *ptrb++;
    // deallocate SH buffers
    for(i=1; i<=n_bounces; ++i) {
        delete[] sh_buffer[i];
    }
    return;
} 
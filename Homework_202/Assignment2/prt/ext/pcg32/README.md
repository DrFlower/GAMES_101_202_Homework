# pcg32
This is a tiny self-contained C++ implementation of the PCG32 random number
based on code by Melissa O'Neill available at http://www.pcg-random.org.

I decided to put together my own version because the official small
implementation lacks a C++ interface and various important features (e.g.
rewind/difference support, shuffling, floating point sample generation), while
while the official C++ version is extremely complex and seems to be intended
for research on PRNGs involving the entire PCG family.

The file ``pcg32_8.h`` contains a vectorized implementation designed by myself
which runs eight PCG32 PRNGs in parallel. Expect to get a ~3-4x speedup when
generating single or double precision floats.

Wenzel Jakob
June 2016

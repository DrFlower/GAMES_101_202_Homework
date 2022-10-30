/*
 * Vectorized AVX2 version of the PCG32 random number generator developed by
 * Wenzel Jakob (June 2016)
 *
 * The PCG random number generator was developed by Melissa O'Neill
 * <oneill@pcg-random.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * For additional information about the PCG random number generation scheme,
 * including its license and other licensing options, visit
 *
 *     http://www.pcg-random.org
 */

#include "pcg32.h"
#include <immintrin.h>
#include <utility>

#if defined(_MSC_VER)
#  define PCG32_ALIGN(amt)    __declspec(align(amt))
#  define PCG32_VECTORCALL    __vectorcall
#  define PCG32_INLINE        __forceinline
#else
#  define PCG32_ALIGN(amt)    __attribute__ ((aligned(amt)))
#  define PCG32_INLINE        __attribute__ ((always_inline))
#  if defined(__clang__)
#    define PCG32_VECTORCALL  __attribute__ ((vectorcall))
#  else
#    define PCG32_VECTORCALL
#  endif
#endif

/// 8 parallel PCG32 pseudorandom number generators
struct PCG32_ALIGN(32) pcg32_8 {

#if defined(__AVX2__)
    __m256i state[2]; // RNG state.  All values are possible.
    __m256i inc[2];   // Controls which RNG sequence (stream) is selected. Must *always* be odd.
#else
    /* Scalar fallback */
    pcg32 rng[8];
#endif

    /// Initialize the pseudorandom number generator with default seed
    pcg32_8() {
        PCG32_ALIGN(32) uint64_t initstate[8] = {
            PCG32_DEFAULT_STATE, PCG32_DEFAULT_STATE,
            PCG32_DEFAULT_STATE, PCG32_DEFAULT_STATE,
            PCG32_DEFAULT_STATE, PCG32_DEFAULT_STATE,
            PCG32_DEFAULT_STATE, PCG32_DEFAULT_STATE
        };

        PCG32_ALIGN(32) uint64_t initseq[8] =
            { 1, 2, 3, 4, 5, 6, 7, 8 };

        seed(initstate, initseq);
    }

    /// Initialize the pseudorandom number generator with the \ref seed() function
    pcg32_8(const uint64_t initstate[8], const uint64_t initseq[8]) {
        seed(initstate, initseq);
    }


#if defined(__AVX2__)
    /**
     * \brief Seed the pseudorandom number generator
     *
     * Specified in two parts: a state initializer and a sequence selection
     * constant (a.k.a. stream id)
     */
    void seed(const uint64_t initstate[8], const uint64_t initseq[8]) {
        const __m256i one = _mm256_set1_epi64x((long long) 1);

        state[0] = state[1] = _mm256_setzero_si256();
        inc[0] = _mm256_or_si256(
            _mm256_slli_epi64(_mm256_load_si256((__m256i *) &initseq[0]), 1),
            one);
        inc[1] = _mm256_or_si256(
            _mm256_slli_epi64(_mm256_load_si256((__m256i *) &initseq[4]), 1),
            one);
        step();

        state[0] = _mm256_add_epi64(state[0], _mm256_load_si256((__m256i *) &initstate[0]));
        state[1] = _mm256_add_epi64(state[1], _mm256_load_si256((__m256i *) &initstate[4]));

        step();
    }

    /// Generate 8 uniformly distributed unsigned 32-bit random numbers
    void nextUInt(uint32_t result[8]) {
        _mm256_store_si256((__m256i *) result, step());
    }

    /// Generate 8 uniformly distributed unsigned 32-bit random numbers
    __m256i PCG32_VECTORCALL nextUInt() {
        return step();
    }

    /// Generate eight single precision floating point value on the interval [0, 1)
    __m256 PCG32_VECTORCALL nextFloat() {
        /* Trick from MTGP: generate an uniformly distributed
           single precision number in [1,2) and subtract 1. */

        const __m256i const1 = _mm256_set1_epi32((int) 0x3f800000u);

        __m256i value = step();
        __m256i fltval = _mm256_or_si256(_mm256_srli_epi32(value, 9), const1);

        return _mm256_sub_ps(_mm256_castsi256_ps(fltval),
                             _mm256_castsi256_ps(const1));
    }

    /// Generate eight single precision floating point value on the interval [0, 1)
    void nextFloat(float result[8]) {
        _mm256_store_ps(result, nextFloat());
    }

    /**
     * \brief Generate eight double precision floating point value on the interval [0, 1)
     *
     * \remark Since the underlying random number generator produces 32 bit output,
     * only the first 32 mantissa bits will be filled (however, the resolution is still
     * finer than in \ref nextFloat(), which only uses 23 mantissa bits)
     */
    std::pair<__m256d, __m256d> nextDouble() {
        /* Trick from MTGP: generate an uniformly distributed
           double precision number in [1,2) and subtract 1. */

        const __m256i const1 =
            _mm256_set1_epi64x((long long) 0x3ff0000000000000ull);

        __m256i value = step();

        __m256i lo = _mm256_cvtepu32_epi64(_mm256_castsi256_si128(value));
        __m256i hi = _mm256_cvtepu32_epi64(_mm256_extractf128_si256(value, 1));

        __m256i tlo = _mm256_or_si256(_mm256_slli_epi64(lo, 20), const1);
        __m256i thi = _mm256_or_si256(_mm256_slli_epi64(hi, 20), const1);

        __m256d flo = _mm256_sub_pd(_mm256_castsi256_pd(tlo),
                                    _mm256_castsi256_pd(const1));

        __m256d fhi = _mm256_sub_pd(_mm256_castsi256_pd(thi),
                                    _mm256_castsi256_pd(const1));

        return std::make_pair(flo, fhi);
    }

    /**
     * \brief Generate eight double precision floating point value on the interval [0, 1)
     *
     * \remark Since the underlying random number generator produces 32 bit output,
     * only the first 32 mantissa bits will be filled (however, the resolution is still
     * finer than in \ref nextFloat(), which only uses 23 mantissa bits)
     */
    void nextDouble(double result[8]) {
        std::pair<__m256d, __m256d> value = nextDouble();

        _mm256_store_pd(&result[0], value.first);
        _mm256_store_pd(&result[4], value.second);
    }

private:
    PCG32_INLINE __m256i PCG32_VECTORCALL step() {
        const __m256i pcg32_mult_l = _mm256_set1_epi64x((long long) (PCG32_MULT & 0xffffffffu));
        const __m256i pcg32_mult_h = _mm256_set1_epi64x((long long) (PCG32_MULT >> 32));
        const __m256i mask_l       = _mm256_set1_epi64x((long long) 0x00000000ffffffffull);
        const __m256i shift0       = _mm256_set_epi32(7, 7, 7, 7, 6, 4, 2, 0);
        const __m256i shift1       = _mm256_set_epi32(6, 4, 2, 0, 7, 7, 7, 7);
        const __m256i const32      = _mm256_set1_epi32(32);

        __m256i s0 = state[0], s1 = state[1];

        /* Extract low and high words for partial products below */
        __m256i s0_l = _mm256_and_si256(s0, mask_l);
        __m256i s0_h = _mm256_srli_epi64(s0, 32);
        __m256i s1_l = _mm256_and_si256(s1, mask_l);
        __m256i s1_h = _mm256_srli_epi64(s1, 32);

        /* Improve high bits using xorshift step */
        __m256i s0s   = _mm256_srli_epi64(s0, 18);
        __m256i s1s   = _mm256_srli_epi64(s1, 18);

        __m256i s0x   = _mm256_xor_si256(s0s, s0);
        __m256i s1x   = _mm256_xor_si256(s1s, s1);

        __m256i s0xs  = _mm256_srli_epi64(s0x, 27);
        __m256i s1xs  = _mm256_srli_epi64(s1x, 27);

        __m256i xors0 = _mm256_and_si256(mask_l, s0xs);
        __m256i xors1 = _mm256_and_si256(mask_l, s1xs);

        /* Use high bits to choose a bit-level rotation */
        __m256i rot0  = _mm256_srli_epi64(s0, 59);
        __m256i rot1  = _mm256_srli_epi64(s1, 59);

        /* 64 bit multiplication using 32 bit partial products :( */
        __m256i m0_hl = _mm256_mul_epu32(s0_h, pcg32_mult_l);
        __m256i m1_hl = _mm256_mul_epu32(s1_h, pcg32_mult_l);
        __m256i m0_lh = _mm256_mul_epu32(s0_l, pcg32_mult_h);
        __m256i m1_lh = _mm256_mul_epu32(s1_l, pcg32_mult_h);

        /* Assemble lower 32 bits, will be merged into one 256 bit vector below */
        xors0 = _mm256_permutevar8x32_epi32(xors0, shift0);
        rot0  = _mm256_permutevar8x32_epi32(rot0, shift0);
        xors1 = _mm256_permutevar8x32_epi32(xors1, shift1);
        rot1  = _mm256_permutevar8x32_epi32(rot1, shift1);

        /* Continue with partial products */
        __m256i m0_ll = _mm256_mul_epu32(s0_l, pcg32_mult_l);
        __m256i m1_ll = _mm256_mul_epu32(s1_l, pcg32_mult_l);

        __m256i m0h   = _mm256_add_epi64(m0_hl, m0_lh);
        __m256i m1h   = _mm256_add_epi64(m1_hl, m1_lh);

        __m256i m0hs  = _mm256_slli_epi64(m0h, 32);
        __m256i m1hs  = _mm256_slli_epi64(m1h, 32);

        __m256i s0n   = _mm256_add_epi64(m0hs, m0_ll);
        __m256i s1n   = _mm256_add_epi64(m1hs, m1_ll);

        __m256i xors  = _mm256_or_si256(xors0, xors1);
        __m256i rot   = _mm256_or_si256(rot0, rot1);

        state[0] = _mm256_add_epi64(s0n, inc[0]);
        state[1] = _mm256_add_epi64(s1n, inc[1]);

        /* Finally, rotate and return the result */
        __m256i result = _mm256_or_si256(
            _mm256_srlv_epi32(xors, rot),
            _mm256_sllv_epi32(xors, _mm256_sub_epi32(const32, rot))
        );

        return result;
    }
#else
    /**
     * \brief Seed the pseudorandom number generator
     *
     * Specified in two parts: a state initializer and a sequence selection
     * constant (a.k.a. stream id)
     */
    void seed(const uint64_t initstate[8], const uint64_t initseq[8]) {
        for (int i = 0; i < 8; ++i)
            rng[i].seed(initstate[i], initseq[i]);
    }

    /// Generate 8 uniformly distributed unsigned 32-bit random numbers
    void nextUInt(uint32_t result[8]) {
        for (int i = 0; i < 8; ++i)
            result[i] = rng[i].nextUInt();
    }

    /// Generate eight single precision floating point value on the interval [0, 1)
    void nextFloat(float result[8]) {
        for (int i = 0; i < 8; ++i)
            result[i] = rng[i].nextFloat();
    }

    /**
     * \brief Generate eight double precision floating point value on the interval [0, 1)
     *
     * \remark Since the underlying random number generator produces 32 bit output,
     * only the first 32 mantissa bits will be filled (however, the resolution is still
     * finer than in \ref nextFloat(), which only uses 23 mantissa bits)
     */
    void nextDouble(double result[8]) {
        for (int i = 0; i < 8; ++i)
            result[i] = rng[i].nextDouble();
    }
#endif
};

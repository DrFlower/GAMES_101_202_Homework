cmake_minimum_required (VERSION 3.13..3.18)
project(openexr)

SET (OPENEXR_INSTALL_HEADER_DEST "include/OpenEXR" CACHE STRING "")
SET (OPENEXR_INSTALL_LIB_DEST "lib" CACHE STRING "")

# Set a default build configuration (Release)
if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
  message(STATUS "Setting build type to 'Release' as none was specified.")
  set(CMAKE_BUILD_TYPE Release CACHE STRING "Choose the type of build." FORCE)
  set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS "Debug" "Release"
    "MinSizeRel" "RelWithDebInfo")
endif()

if (CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-switch -Wno-tautological-compare -Wno-deprecated-register")
elseif (CMAKE_CXX_COMPILER_ID MATCHES "GNU")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-unused-result -Wno-deprecated")
elseif (CMAKE_CXX_COMPILER_ID MATCHES "MSVC")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /wd4275 /wd4267 /wd4244 /wd4477 /wd4996 /wd4800 /wd4334 /wd4251 /wd4305 /wd4302 /wd4311 /wd4018")
endif()

if (WIN32 AND NOT TARGET zlib)
  # Build zlib (only on Windows)
  set(ZLIB_BUILD_STATIC_LIBS OFF CACHE BOOL " " FORCE)
  set(ZLIB_BUILD_SHARED_LIBS ON CACHE BOOL " " FORCE)
  add_subdirectory(zlib)

  set(ZLIB_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/zlib;${CMAKE_CURRENT_BINARY_DIR}/zlib" CACHE PATH " " FORCE)
  set(ZLIB_LIBRARIES zlib CACHE FILEPATH " " FORCE)
else()
endif()

add_subdirectory(IlmBase)
include_directories(
  IlmBase/Iex
  IlmBase/Imath
  IlmBase/IlmThread
  IlmBase/Half
  ${CMAKE_CURRENT_BINARY_DIR}/IlmBase/config
)

add_subdirectory(OpenEXR)

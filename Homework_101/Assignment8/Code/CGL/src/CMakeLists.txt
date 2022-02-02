cmake_minimum_required(VERSION 2.8)

include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# CGL library source files
set(CGL_SOURCE
    vector2D.cpp
    vector3D.cpp
    vector4D.cpp
    matrix3x3.cpp
    matrix4x4.cpp
    quaternion.cpp
    complex.cpp
    color.cpp
    osdtext.cpp
    osdfont.c
    viewer.cpp
    base64.cpp
    tinyxml2.cpp
)

# CGL library header files
set(CGL_HEADER
    CGL.h
    vector2D.h
    vector3D.h
    vector4D.h
    matrix3x3.h
    matrix4x4.h
    quaternion.h
    complex.h
    color.h
    osdtext.h
    viewer.h
    base64.h
    tinyxml2.h
    renderer.h
)

#-------------------------------------------------------------------------------
# Building static library (always)
#-------------------------------------------------------------------------------
add_library(CGL STATIC ${CGL_SOURCE} ${CGL_HEADER})

target_link_libraries(
  CGL
  ${GLEW_LIBRARIES}
  ${GLFW_LIBRARIES}
  ${OPENGL_LIBRARIES}
  ${FREETYPE_LIBRARIES}
)

#-------------------------------------------------------------------------------
# Building shared library
#-------------------------------------------------------------------------------
if(CGL_BUILD_SHARED)
  add_library(CGL_SHARED SHARED ${CGL_SOURCE} ${CGL_HEADER})
  target_link_libraries(
    CGL_SHARED
    ${GLEW_LIBRARIES}
    ${GLFW_LIBRARIES}
    ${OPENGL_LIBRARIES}
    ${FREETYPE_LIBRARIES}
  )
endif()

#-------------------------------------------------------------------------------
# Platform-specific target configurations
#-------------------------------------------------------------------------------

###################
# Building on OSX #
###################
if (APPLE)

  # Clang options
  target_compile_options(CGL PRIVATE -Wno-constant-conversion)

  # Framework dependencies
  target_link_libraries(CGL
    ${COCOA_LIBRARIES}
    ${IOKIT_LIBRARIES}
    ${COREVIDEO_LIBRARIES})

  # Output name
  if(CGL_BUILD_DEBUG)
    set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL_osx_d)
    if(CGL_BUILD_SHARED)
      set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL_osx_d)
    endif()
  else(CGL_BUILD_DEBUG)
    set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL_osx)
    if(CGL_BUILD_SHARED)
      set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL_osx)
    endif()
  endif(CGL_BUILD_DEBUG)
  
endif(APPLE)

##################
# Build on Linux #
##################
set(LINUX UNIX AND NOT APPLE)
if(LINUX)
  if(CGL_BUILD_DEBUG)
    set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL_d)
    if(CGL_BUILD_SHARED)
      set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL_d)
    endif()
  else(CGL_BUILD_DEBUG)
    set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL)
    if(CGL_BUILD_SHARED)
      set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL)
    endif()
  endif(CGL_BUILD_DEBUG)
endif(LINUX)

####################
# Build on Windows #
####################
if(WIN32)
  
  if(MSVC)
    if(CGL_BUILD_DEBUG)
      set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL_d)
      if(CGL_BUILD_SHARED)
        set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL_d)
      endif()
    else(CGL_BUILD_DEBUG)
      set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL)
      if(CGL_BUILD_SHARED)
        set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL)
      endif()
    endif(CGL_BUILD_DEBUG)
  endif(MSVC)

  if(MINGW)
    if(CGL_BUILD_DEBUG)
      set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL_d)
      if(CGL_BUILD_SHARED)
        set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL_d)
      endif()
    else(CGL_BUILD_DEBUG)
      set_target_properties(CGL PROPERTIES OUTPUT_NAME CGL)
      if(CGL_BUILD_SHARED)
        set_target_properties(CGL_SHARED PROPERTIES OUTPUT_NAME CGL)
      endif()
    endif(CGL_BUILD_DEBUG)
  endif(MINGW)

endif(WIN32)

#-------------------------------------------------------------------------------
# Installation configurations
#-------------------------------------------------------------------------------
install(TARGETS CGL DESTINATION lib)
if(CGL_BUILD_SHARED)
  install(TARGETS CGL_SHARED DESTINATION lib)
endif()

# install headers
install(FILES ${CGL_HEADER} DESTINATION include/CGL)
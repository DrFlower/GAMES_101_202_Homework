link_libraries(CGL)

include_directories("${PROJECT_SOURCE_DIR}/src")

link_libraries(
  glfw ${GLFW_LIBRARIES}
  glew ${GLEW_LIBRARIES}
  ${OPENGL_LIBRARIES}
  ${FREETYPE_LIBRARIES}
)

# OSD
add_executable(osd osd.cpp)

# Install tests
install(TARGETS osd DESTINATION bin/tests)

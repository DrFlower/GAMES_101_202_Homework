link_libraries(CGL)

include_directories("${PROJECT_SOURCE_DIR}/src")

link_libraries(
  glfw ${GLFW_LIBRARIES}
  glew ${GLEW_LIBRARIES}
  ${OPENGL_LIBRARIES}
  ${FREETYPE_LIBRARIES}
)

add_executable(triangle triangle.cpp)
add_executable(text text.cpp)

# Install examples
install(TARGETS triangle DESTINATION bin/examples)
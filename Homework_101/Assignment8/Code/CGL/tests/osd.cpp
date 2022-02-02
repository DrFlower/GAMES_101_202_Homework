#include "color.h"
#include "osdtext.h"

#include <stdlib.h>

#include "GL/glew.h"
#include "GLFW/glfw3.h"

using namespace CGL;

int main(int argc, char *argv[]) {

  GLFWwindow* window;
  OSDText* osd_text;

  // init glfw
  if( !glfwInit() ) {
    fprintf(stderr, "Error: could not initialize GLFW!");
    exit( EXIT_FAILURE );
  }

  // create window
  window = glfwCreateWindow( 640, 480, "TEXT", NULL, NULL );
  if (!window) {
    fprintf(stderr, "Error: could not create window!");
    glfwTerminate();
    exit( EXIT_FAILURE );
  }

  // set context
  glfwMakeContextCurrent( window );
  glfwSwapInterval(1);

  // init glew
  GLenum glew_status = glewInit();
  if (GLEW_OK != glew_status) {
    fprintf(stderr, "Error: %s\n", glewGetErrorString(glew_status));
    return 1;
  }

  if (!GLEW_VERSION_2_0) {
    fprintf(stderr, "No support for OpenGL 2.0 found\n");
    return 1;
  }

  // enable alpha blending
  glEnable(GL_BLEND);
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

  // create on-screen display text
  osd_text = new OSDText();
  osd_text->init();
  osd_text->resize(640, 480);

  // add lines
  const char* text = "The Quick Brown Fox Jumps Over The Lazy Dog.";
  osd_text->add_line(-0.95, 0.85, text, 26, Color::White);
  osd_text->add_line(-0.95, 0.70, text, 24, Color(0.75,0.75,0.75,1));
  osd_text->add_line(-0.95, 0.58, text, 22, Color(0.5,0.5,0.5,1));
  osd_text->add_line(-0.95, 0.46, text, 20, Color(1,0,0,1));
  osd_text->add_line(-0.95, 0.34, text, 18, Color(0,1,0,1));
  osd_text->add_line(-0.95, 0.25, text, 16, Color(0,0,1,1));
  osd_text->add_line(-0.95, 0.16, text, 14, Color(1,1,0,1));
  osd_text->add_line(-0.95, 0.08, text, 12, Color(0,1,1,1));
  osd_text->add_line(-0.95, 0.00, text, 10, Color(1,0,1,1));

  while(!glfwWindowShouldClose(window)) {

    // clear
    glClear(GL_COLOR_BUFFER_BIT);

    // render text OSD
    osd_text->render();

    // swap buffers
    glfwSwapBuffers(window);

    // poll events
    glfwPollEvents();
  }

  return 0;
}

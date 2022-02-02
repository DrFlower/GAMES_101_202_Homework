#include <string>
#include <iostream>

#include "viewer.h"
#include "renderer.h"

using namespace std;
using namespace CGL;

class TriangleDrawer : public Renderer {
 public:

  ~TriangleDrawer() { }

  string name() {
    return "Triangle Renderer";
  }

  string info() {
    return "I just draw a blue triangle";
  }

  void init() {
    return;
  }
  
  void render() {
    if (shoud_draw) {
      glBegin(GL_TRIANGLES);
      glColor3f( 0.1, 0.2, 0.3);
      glVertex3f(0.0, 0.5, 0.0);
      glVertex3f(-.5, -.5, 0.0);
      glVertex3f(0.5, -.5, 0.0);
      glEnd();
    }
  }

  void resize(size_t w, size_t h) {
    
    this->w = w;
    this->h = h;

    return;
  }

  void key_event(char key) {
    if (key == 'R') shoud_draw = !shoud_draw; 
    return;
  }
  
  void cursor_event(float x, float y, unsigned char keys) {

    // translate when left mouse button is held down
    if (keys & (1 << 2)) { 
      float dx = x - cursor_x;
      float dy = y - cursor_y;
      glTranslatef(0.5 * dx / w, - 0.5 * dy / h, 0);       
    }

    // update
    cursor_x = x;
    cursor_y = y;
  }

  void scroll_event(float offset_x, float offset_y) {
    float scale = 1 + 0.1 * offset_x - 0.1 * offset_y;
    glScalef(scale, scale, 1);
  }

  void mouse_button_event(int button, int event) {
    switch (event) {
      case MOUSE_BUTTON_PRESS:
        cerr << "You clicked button " << button << endl; 
        break;
      case MOUSE_BUTTON_RELEASE:
        cerr << "You released button " << button << endl;
        break; 
    }
  }

 private:

  // show draw triangle
  bool shoud_draw;
  
  // frame buffer size
  size_t w, h; 

  // cursor position
  float cursor_x, cursor_y;
};

int main( int argc, char** argv ) {

  // create viewer
  Viewer viewer = Viewer();

  // defined a user space renderer
  Renderer* renderer = new TriangleDrawer();

  // set user space renderer
  viewer.set_renderer(renderer);

  // start the viewer
  viewer.init();
  viewer.start();

  return 0;
}


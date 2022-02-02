#include <string>
#include <iostream>

#include "viewer.h"
#include "renderer.h"

using namespace std;
using namespace CGL;

class TextDrawer : public Renderer {
 public:

  ~TextDrawer() { }

  string name() {
    return "Text Renderer";
  }

  string info() {
    return "I just draw a bunch of text on screen";
  }

  void init() {

    text_mgr.init(use_hdpi);

    size = 16;
    line0 = text_mgr.add_line(0.0, 0.0, "Hi there!", size, Color::White);

    return;
  }

  void render() {

    text_mgr.render();

  }

  void resize(size_t w, size_t h) {

    this->w = w;
    this->h = h;

    text_mgr.resize(w,h);

    return;
  }

  void cursor_event(float x, float y, unsigned char keys) {
    if (keys & (1 << 2)) {
      text_mgr.set_anchor(line0, 2 * (x - .5 * w) / w, 2 * (.5 * h - y) / h);
    }
  }

  void scroll_event(float offset_x, float offset_y) {
    size += int(offset_y + offset_x);
    text_mgr.set_size(line0, size);
  }


 private:

  // OSD text manager
  OSDText text_mgr;

  // my line id's
  int line0;

  // my line's font size
  size_t size;

  // frame buffer size
  size_t w, h;

};


int main( int argc, char** argv ) {

  // create viewer
  Viewer viewer = Viewer();

  // defined a user space renderer
  Renderer* renderer = new TextDrawer();

  // set user space renderer
  viewer.set_renderer(renderer);

  // start the viewer
  viewer.init();
  viewer.start();

  return 0;
}

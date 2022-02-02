#include "CGL/CGL.h"
#include "CGL/viewer.h"

#include "application.h"
typedef uint32_t gid_t;

#include <iostream>
#include <unistd.h>

using namespace std;
using namespace CGL;

void usage(const char *binaryName) {
  printf("Usage: %s [options] <scenefile>\n", binaryName);
  printf("Program Options:\n");
  printf("  -m  <FLOAT>            Mass per node\n");
  printf("  -g  <FLOAT> <FLOAT>    Gravity vector (x, y)\n");
  printf("  -s  <INT>              Number of steps per simulation frame\n");
  printf("\n");
}

int main(int argc, char **argv) {
  AppConfig config;
  int opt;

  while ((opt = getopt(argc, argv, "s:l:t:m:e:h:f:r:c:a:p:")) != -1) {
    switch (opt) {
    case 'm':
      config.mass = atof(optarg);
      break;
    case 'g':
      config.gravity = Vector2D(atof(argv[optind - 1]), atof(argv[optind]));
      optind++;
      break;
    case 's':
      config.steps_per_frame = atoi(optarg);
      break;
    default:
      usage(argv[0]);
      return 1;
    }
  }

  // create application
  Application *app = new Application(config);

  // create viewer
  Viewer viewer = Viewer();

  // set renderer
  viewer.set_renderer(app);

  // init viewer
  viewer.init();

  // start viewer
  viewer.start();

  return 0;
}

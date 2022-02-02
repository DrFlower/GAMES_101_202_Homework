#ifndef ROPE_H
#define ROPE_H

#include "CGL/CGL.h"
#include "mass.h"
#include "spring.h"

using namespace std;

namespace CGL {

class Rope {
public:
  Rope(vector<Mass *> &masses, vector<Spring *> &springs)
      : masses(masses), springs(springs) {}
  Rope(Vector2D start, Vector2D end, int num_nodes, float node_mass, float k,
       vector<int> pinned_nodes);

  void simulateVerlet(float delta_t, Vector2D gravity);
  void simulateEuler(float delta_t, Vector2D gravity);

  vector<Mass *> masses;
  vector<Spring *> springs;
}; // struct Rope
}
#endif /* ROPE_H */

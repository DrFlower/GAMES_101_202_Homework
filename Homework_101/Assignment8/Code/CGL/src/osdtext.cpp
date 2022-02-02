#include "osdtext.h"

#include <iostream>

#include "ft2build.h"
#include FT_FREETYPE_H

#include "base64.h"
#include "console.h"

using namespace std;

namespace CGL {

struct point {
    GLfloat x;
    GLfloat y;
    GLfloat s;
    GLfloat t;
};

OSDText::OSDText() {

  use_hdpi = false;

  ft   = new FT_Library;
  face = new FT_Face;

  lines = vector<OSDLine>(); next_id = 0;
}

OSDText::~OSDText() {

  delete ft;
  delete font;
  delete face;

  lines.clear();
  
  glDeleteProgram(program);
}

int OSDText::init(bool use_hdpi) {

  this->use_hdpi = use_hdpi;

  // initialize font library
  if(FT_Init_FreeType(ft)) {
    out_err("Cannot init freetype library");
    return -1;
  }

  // decode font and keep in memory
  string encoded = osdfont_base64;
  string decoded = base64_decode(encoded);
  size_t size = decoded.size(); 
  font = new char[size]; 
  memcpy(font, decoded.c_str(), size);

  // initialize font face
  if(FT_New_Memory_Face(*ft, (const FT_Byte*) font, size, 0, face)) {
    cerr << font;
    out_err("Cannot open font");
    return -1;
  }

  // compile shaders
  program = compile_shaders();
  if(program) {
      attribute_coord = get_attribu ( program, "coord" );
      uniform_tex     = get_uniform ( program, "tex"   );
      uniform_color   = get_uniform ( program, "color" );
      if (attribute_coord == -1 || uniform_tex == -1 || uniform_color == -1) {
          return -1;
      }
  } else return -1;

  // create the vbo
  glGenBuffers(1, &vbo);

  return 0;
}

void OSDText::render() {
  
  glUseProgram(program);

  vector<OSDLine>::iterator it = lines.begin();
  while(it != lines.end()) {
    draw_line(*it);
    ++it;
  }
  
  glUseProgram(0);
}

void OSDText::resize(size_t w, size_t h) {
    sx = 2.0f / w;
    sy = 2.0f / h;
}


int OSDText::add_line(float x, float y, string text,
                      size_t size, Color color) {
  // create new line
  OSDLine new_line = OSDLine();
  new_line.x = x;
  new_line.y = y;
  new_line.text = text;
  new_line.size = size;
  new_line.color = color;

  // handle HDPI display
  if (use_hdpi) new_line.size *= 2;

  // update id
  new_line.id = next_id;
  next_id++;

  // add line
  lines.push_back(new_line);

  return new_line.id;
}

void OSDText::del_line(int line_id) {
  vector<OSDLine>::iterator it = lines.begin();
  while(it != lines.end()) {
    if(it->id == line_id) { 
      lines.erase(it);
      break;
    }
    ++it;
  }
}

void OSDText::set_anchor(int line_id, float x, float y) {
  vector<OSDLine>::iterator it = lines.begin();
  while(it != lines.end()) {
    if(it->id == line_id) { 
      it->x = x;
      it->y = y;
      break;
    }
    ++it;
  }  
}

void OSDText::set_text(int line_id, string text) {
  vector<OSDLine>::iterator it = lines.begin();
  while(it != lines.end()) {
    if(it->id == line_id) { 
      it->text = text;
      break;
    }
    ++it;
  }  
}

void OSDText::set_size(int line_id, size_t size) {
  vector<OSDLine>::iterator it = lines.begin();
  while(it != lines.end()) {
    if(it->id == line_id) { 
      it->size = size;
      break;
    }
    ++it;
  }
}

void OSDText::set_color(int line_id, Color color) {
  vector<OSDLine>::iterator it = lines.begin();
  while(it != lines.end()) {
    if(it->id == line_id) {
      it->color = color;
      break;
    }
    ++it;
  }
}

void OSDText::draw_line(OSDLine line) {

  // set font size
  FT_Set_Pixel_Sizes(*face, 0, line.size);

  // set font color
  glUniform4fv(uniform_color, 1, (GLfloat*) &line.color);

  // get glyph
  const char *p;
  FT_GlyphSlot g = (*face)->glyph;

  // gen texture
  GLuint tex;
  glActiveTexture(GL_TEXTURE0);
  glGenTextures(1, &tex);
  glBindTexture(GL_TEXTURE_2D, tex);
  glUniform1i(uniform_tex, 0);

  // require 1 byte alignment when uploading texture data 
  glPixelStorei(GL_UNPACK_ALIGNMENT, 1);

  // clamping to edges is important to prevent artifacts when scaling
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

  // linear filtering usually looks best for text
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

  // set up the VBO for our vertex data
  glEnableVertexAttribArray(attribute_coord);
  glBindBuffer(GL_ARRAY_BUFFER, vbo);
  glVertexAttribPointer(attribute_coord, 4, GL_FLOAT, GL_FALSE, 0, 0);

  // loop through all characters
  const char* text = line.text.c_str();
  for (p = text; *p; p++) {

    // Try to load and render the character
    if (FT_Load_Char(*face, *p, FT_LOAD_RENDER)) continue;

    // Upload the glyph bitmap as an alpha texture
    glTexImage2D(GL_TEXTURE_2D, 
                 0, GL_ALPHA, g->bitmap.width, g->bitmap.rows, 
                 0, GL_ALPHA, GL_UNSIGNED_BYTE, g->bitmap.buffer);

    // calculate the vertex and texture coordinates
    float x2 =  line.x + g->bitmap_left * sx;
    float y2 = -line.y - g->bitmap_top  * sy;
    float w = g->bitmap.width * sx;
    float h = g->bitmap.rows  * sy;

    point box[4] = {
      {x2, -y2, 0, 0},
      {x2 + w, -y2, 1, 0},
      {x2, -y2 - h, 0, 1},
      {x2 + w, -y2 - h, 1, 1},
    };

    // draw the character to screen 
    glBufferData(GL_ARRAY_BUFFER, sizeof box, box, GL_DYNAMIC_DRAW);
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

    // Advance the cursor to the start of the next character
    line.x += (g->advance.x >> 6) * sx;
    line.y += (g->advance.y >> 6) * sy;
  }

  glDisableVertexAttribArray(attribute_coord);
  glDeleteTextures(1, &tex);

}

GLuint OSDText::compile_shaders() {

  // create the shaders
  GLuint vert_shader = glCreateShader(GL_VERTEX_SHADER);
  GLuint frag_shader = glCreateShader(GL_FRAGMENT_SHADER);

  const char *vert_shader_src = "#version 120"
  "\nattribute vec4 coord;"
  "\nvarying vec2 texpos;"
  "\nvoid main(void) {"
  "\n  gl_Position = vec4(coord.xy, 0, 1);"
  "\n  texpos = coord.zw;"
  "\n}";

  const char *frag_shader_src = "#version 120"
  "\nvarying vec2 texpos;"
  "\nuniform sampler2D tex;"
  "\nuniform vec4 color;"
  "\nvoid main(void) {"
  "\n  gl_FragColor = vec4(1, 1, 1, texture2D(tex, texpos).a) * color;"
  "\n}";

// with drop shadow
//  "\nvarying vec2 texpos;"
//  "\nuniform sampler2D tex;"
//  "\nuniform vec4 color;"
//  "\n"
//  "\nconst float smoothing = 1.0/4.0;"
//  "\nconst vec2 shadowOffset = vec2(-1.0/512.0);"
//  "\nconst vec4 glowColor = vec4(vec3(0.1), 1.0);"
//  "\nconst float glowMin = 0.2;"
//  "\nconst float glowMax = 0.8;"
//  "\n"
//  "\n// drop shadow computed in fragment shader"
//  "\nvoid main() {"
//  "\n    vec4 texColor = texture2D(tex, texpos);"
//  "\n    float dst = texColor.a;"
//  "\n    float alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, dst);"
//  "\n"
//  "\n    float glowDst = texture2D(tex, texpos + shadowOffset).a;"
//  "\n    vec4 glow = glowColor * smoothstep(glowMin, glowMax, glowDst);"
//  "\n"
//  "\n    float mask = 1.0-alpha;"
//  "\n"
//  "\n    vec4 base = color * vec4(vec3(1.0), dst);"
//  "\n    gl_FragColor = mix(base, glow, mask);"
//  "\n}";

  GLint result = GL_FALSE;
  int info_length;

  // compile Vertex Shader
  glShaderSource(vert_shader, 1, &vert_shader_src, NULL);
  glCompileShader(vert_shader);

  // check Vertex Shader
  glGetShaderiv(vert_shader, GL_COMPILE_STATUS, &result);
  glGetShaderiv(vert_shader, GL_INFO_LOG_LENGTH, &info_length);
  if ( info_length > 0 ){
    vector<char> vert_shader_errmsg(info_length+1);
    glGetShaderInfoLog(vert_shader, info_length, NULL, &vert_shader_errmsg[0]);
    printf("%s\n", &vert_shader_errmsg[0]);
  }

  // compile Fragment Shader
  glShaderSource(frag_shader, 1, &frag_shader_src, NULL);
  glCompileShader(frag_shader);

  // check Fragment Shader
  glGetShaderiv(frag_shader, GL_COMPILE_STATUS, &result);
  glGetShaderiv(frag_shader, GL_INFO_LOG_LENGTH, &info_length);
  if ( info_length > 0 ){
    vector<char> frag_shader_errmsg(info_length+1);
    glGetShaderInfoLog(frag_shader, info_length, NULL, &frag_shader_errmsg[0]);
    printf("%s\n", &frag_shader_errmsg[0]);
  }

  // link the program
  GLuint program = glCreateProgram();
  glAttachShader(program, vert_shader);
  glAttachShader(program, frag_shader);
  glLinkProgram(program);

  // check the program
  glGetProgramiv(program, GL_LINK_STATUS, &result);
  glGetProgramiv(program, GL_INFO_LOG_LENGTH, &info_length);
  if ( info_length > 0 ){
    vector<char> program_errmsg(info_length+1);
    glGetProgramInfoLog(program, info_length, NULL, &program_errmsg[0]);
    printf("%s\n", &program_errmsg[0]);
  }

  glDetachShader(1, vert_shader);
  glDetachShader(1, frag_shader);
  glDeleteShader(vert_shader);
  glDeleteShader(frag_shader);

  return program;
}

GLint OSDText::get_attribu(GLuint program, const char *name) {
  GLint attribute = glGetAttribLocation(program, name);
  if(attribute == -1)
    fprintf(stderr, "Cannot bind attribute %s\n", name);
  return attribute;
}

GLint OSDText::get_uniform(GLuint program, const char *name) {
  GLint uniform = glGetUniformLocation(program, name);
  if(uniform == -1)
    fprintf(stderr, "Cannot bind uniform %s\n", name);
  return uniform;
}

} // namespace CGL

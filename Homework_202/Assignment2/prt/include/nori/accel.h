/*
    This file is part of Nori, a simple educational ray tracer

    Copyright (c) 2015 by Wenzel Jakob

    Nori is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License Version 3
    as published by the Free Software Foundation.

    Nori is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

#pragma once

#include <nori/mesh.h>

NORI_NAMESPACE_BEGIN

static constexpr uint32_t MAX_TRIANGLES_PER_NODE = 15;
static constexpr uint32_t MAX_RECURSION_DEPTH = 10;
static constexpr uint32_t MAX_NUM_MESHES = 32;

/**
 * \brief Acceleration data structure for ray intersection queries
 *
 * The current implementation falls back to a brute force loop
 * through the geometry.
 */
class Accel {

    struct Node {
        uint32_t num_triangles = 0;
        BoundingBox3f bbox;
        Node* next = nullptr;
        Node* child = nullptr;
        uint32_t* triangle_indices = nullptr;
        uint32_t* mesh_indices = nullptr;

        ~Node() {
            delete[] triangle_indices;
            delete[] mesh_indices;
            delete next;
            delete child;
        }
    };

public:
    ~Accel() { delete m_root; }

    /**
     * \brief Register a triangle mesh for inclusion in the acceleration
     * data structure
     *
     * This function can only be used before \ref build() is called
     */
    void addMesh(Mesh *mesh);

    /// Build the acceleration data structure (currently a no-op)
    void build();

    /// Return an axis-aligned box that bounds the scene
    const BoundingBox3f &getBoundingBox() const { return m_bbox; }

    /**
     * \brief Intersect a ray against all triangles stored in the scene and
     * return detailed intersection information
     *
     * \param ray
     *    A 3-dimensional ray data structure with minimum/maximum extent
     *    information
     *
     * \param its
     *    A detailed intersection record, which will be filled by the
     *    intersection query
     *
     * \param shadowRay
     *    \c true if this is a shadow ray query, i.e. a query that only aims to
     *    find out whether the ray is blocked or not without returning detailed
     *    intersection information.
     *
     * \return \c true if an intersection was found
     */
    bool rayIntersect(const Ray3f &ray, Intersection &its, bool shadowRay) const;

private:
    Node* buildRecursive(const BoundingBox3f& bbox, std::vector<uint32_t>& triangle_indices,
            std::vector<uint32_t>& mesh_indices, uint32_t recursion_depth);
    bool traverseRecursive(const Node& node, Ray3f &ray, Intersection &its, bool shadowRay, uint32_t& hit_idx) const;
    static void subdivideBBox(const BoundingBox3f& parent, BoundingBox3f* bboxes);

    Mesh*         m_meshes[MAX_NUM_MESHES]; ///< Meshes (up to MAX_NUM_MESHES meshes)
    BoundingBox3f m_bbox;           ///< Bounding box of the entire scene
    Node*         m_root = nullptr; ///< Root node of Octree
    uint32_t      m_num_meshes = 0; ///< number of meshes in accel

    // only statistics
    uint32_t m_num_nonempty_leaf_nodes = 0;
    uint32_t m_num_leaf_nodes = 0;
    uint32_t m_num_nodes = 0;
    uint32_t m_recursion_depth = 0;
    uint32_t m_num_triangles_saved = 0;
};

NORI_NAMESPACE_END
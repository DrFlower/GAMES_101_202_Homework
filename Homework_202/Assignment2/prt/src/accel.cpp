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

#include <nori/accel.h>
#include <Eigen/Geometry>
#include <chrono>

using namespace std::chrono;

NORI_NAMESPACE_BEGIN

void Accel::addMesh(Mesh *mesh) {
    if (m_num_meshes >= MAX_NUM_MESHES)
        throw NoriException("Accel: only %d meshes are supported!", MAX_NUM_MESHES);
    m_meshes[m_num_meshes] = mesh;
    m_bbox.expandBy(mesh->getBoundingBox());
    m_num_meshes++;
}

void Accel::build() {
    if (m_num_meshes == 0)
        throw NoriException("No mesh found, could not build acceleration structure");

    auto start = high_resolution_clock::now();
    // delete old hierarchy if present
    delete m_root;

    uint32_t num_triangles = 0;
    for (uint32_t mesh_idx = 0; mesh_idx < m_num_meshes; mesh_idx++) {
        num_triangles += m_meshes[mesh_idx]->getTriangleCount();
    }

    std::vector<uint32_t> triangles(num_triangles);
    std::vector<uint32_t> mesh_indices(num_triangles);
    uint32_t offset = 0;

    for (uint32_t current_mesh_idx = 0; current_mesh_idx < m_num_meshes; current_mesh_idx++) {
        uint32_t num_triangles_mesh = m_meshes[current_mesh_idx]->getTriangleCount();
        for (uint32_t i = 0; i < num_triangles_mesh; i++) {
            triangles[offset + i] = i;
            mesh_indices[offset + i] = current_mesh_idx;
        }
        offset += num_triangles_mesh;
    }

    m_root = buildRecursive(m_bbox, triangles, mesh_indices, 0);
    printf("Octree build time: %ldms \n", duration_cast<milliseconds>(high_resolution_clock::now() - start).count());
    printf("Num nodes: %d \n", m_num_nodes);
    printf("Num leaf nodes: %d \n", m_num_leaf_nodes);
    printf("Num non-empty leaf nodes: %d \n", m_num_nonempty_leaf_nodes);
    printf("Total number of saved triangles: %d \n", m_num_triangles_saved);
    printf("Avg triangles per node: %f \n", (float)m_num_triangles_saved / (float)m_num_nodes);
    printf("Recursion depth: %d \n", m_recursion_depth);
}

bool Accel::rayIntersect(const Ray3f &ray_, Intersection &its, bool shadowRay) const {
    bool foundIntersection;  // Was an intersection found so far?
    uint32_t f = (uint32_t) -1;      // Triangle index of the closest intersection

    Ray3f ray(ray_); /// Make a copy of the ray (we will need to update its '.maxt' value)

    foundIntersection = traverseRecursive(*m_root, ray, its, shadowRay, f);
    if (shadowRay)
        return foundIntersection;

    if (foundIntersection) {
        /* At this point, we now know that there is an intersection,
           and we know the triangle index of the closest such intersection.

           The following computes a number of additional properties which
           characterize the intersection (normals, texture coordinates, etc..)
        */

        /* Find the barycentric coordinates */
        Vector3f bary;
        bary << 1-its.uv.sum(), its.uv;

        /* References to all relevant mesh buffers */
        const Mesh *mesh   = its.mesh;
        const MatrixXf &V  = mesh->getVertexPositions();
        const MatrixXf &N  = mesh->getVertexNormals();
        const MatrixXf &UV = mesh->getVertexTexCoords();
        const MatrixXu &F  = mesh->getIndices();

        /* Vertex indices of the triangle */
        uint32_t idx0 = F(0, f), idx1 = F(1, f), idx2 = F(2, f);

        Point3f p0 = V.col(idx0), p1 = V.col(idx1), p2 = V.col(idx2);

        its.bary = bary;

        its.tri_index = Point3f(idx0, idx1, idx2);

        /* Compute the intersection positon accurately
           using barycentric coordinates */
        its.p = bary.x() * p0 + bary.y() * p1 + bary.z() * p2;

        /* Compute proper texture coordinates if provided by the mesh */
        if (UV.size() > 0)
            its.uv = bary.x() * UV.col(idx0) +
                bary.y() * UV.col(idx1) +
                bary.z() * UV.col(idx2);

        /* Compute the geometry frame */
        its.geoFrame = Frame((p1-p0).cross(p2-p0).normalized());

        if (N.size() > 0) {
            /* Compute the shading frame. Note that for simplicity,
               the current implementation doesn't attempt to provide
               tangents that are continuous across the surface. That
               means that this code will need to be modified to be able
               use anisotropic BRDFs, which need tangent continuity */

            its.shFrame = Frame(
                (bary.x() * N.col(idx0) +
                 bary.y() * N.col(idx1) +
                 bary.z() * N.col(idx2)).normalized());
        } else {
            its.shFrame = its.geoFrame;
        }
    }

    return foundIntersection;
}

Accel::Node* Accel::buildRecursive(const BoundingBox3f& bbox, std::vector<uint32_t>& triangle_indices,
        std::vector<uint32_t>& mesh_indices, uint32_t recursion_depth) {
    // a node is created in any case
    m_num_nodes++;

    uint32_t num_triangles = triangle_indices.size();

    // return empty node if no triangles are left
    if (num_triangles == 0) {
        Node* node = new Node();
        node->bbox = BoundingBox3f(bbox);

        // add to statistics
        m_num_leaf_nodes++;
        return node;
    }

    // create leaf node if 10 or less triangles are left or if the max recursion depth is reached.
    if (num_triangles <= MAX_TRIANGLES_PER_NODE || recursion_depth >= MAX_RECURSION_DEPTH) {
        Node* node = new Node();
        node->num_triangles = num_triangles;
        node->triangle_indices = new uint32_t[num_triangles];
        node->mesh_indices = new uint32_t [num_triangles];

        for (uint32_t i = 0; i < num_triangles; i++) {
            node->triangle_indices[i] = triangle_indices[i];
            node->mesh_indices[i] = mesh_indices[i];
        }
        node->bbox = BoundingBox3f(bbox);

        // add to statistics
        m_num_leaf_nodes++;
        m_num_nonempty_leaf_nodes++;
        m_num_triangles_saved += num_triangles;
        return node;
    }

    // create new parent node
    Node* node = new Node();
    node->bbox = BoundingBox3f(bbox);

    BoundingBox3f child_bboxes[8] = {};
    subdivideBBox(bbox, child_bboxes);

    std::vector<std::vector<uint32_t>> child_triangle_indices(8);
    std::vector<std::vector<uint32_t>> child_mesh_indices(8);

    uint32_t child_num_triangles[8] = {};

    // place every triangle in the children it overlaps with
    // for every child bbox
    for (uint32_t i = 0; i < 8; i++) {
        // for every triangle inside of the parent create triangle bounding box
        for (uint32_t j = 0; j < num_triangles; j++) {
            // for every triangle vertex expand triangle bbox
            uint32_t triangle_idx = triangle_indices[j];
            uint32_t mesh_idx = mesh_indices[j];
            BoundingBox3f triangle_bbox = m_meshes[mesh_idx]->getBoundingBox(triangle_idx);

            // check if triangle is in bbox, if so put triangle index into triangle list of child
            if (child_bboxes[i].overlaps(triangle_bbox)) {
                child_triangle_indices[i].emplace_back(triangle_idx);
                child_mesh_indices[i].emplace_back(mesh_idx);
                child_num_triangles[i]++;
            }
        }
    }

    // release memory to avoid stack overflow
    triangle_indices = std::vector<uint32_t>();
    mesh_indices = std::vector<uint32_t>();

    // for every child bbox
    Node* last_child = nullptr;
    for (uint32_t i = 0; i < 8; i++) {   
        // first child
        if (i == 0) {
            node->child = buildRecursive(child_bboxes[i], child_triangle_indices[i], child_mesh_indices[i], recursion_depth + 1);
            last_child = node->child;
        // neighbour children
        } else {
            last_child->next = buildRecursive(child_bboxes[i], child_triangle_indices[i], child_mesh_indices[i], recursion_depth + 1);
            last_child = last_child->next;
        }
        m_recursion_depth = std::max(m_recursion_depth, recursion_depth + 1);
    }
    return node;
}

bool Accel::traverseRecursive(const Node& node, Ray3f &ray, Intersection &its, bool shadowRay, uint32_t& hit_idx) const {
    bool foundIntersection = false;

    // only check triangles of node and its children if ray intersects with node bbox
    if (!node.bbox.rayIntersect(ray)) {
        return false;
    }

    // search through all triangles in node
    for (uint32_t i = 0; i < node.num_triangles; ++i) {
        float u, v, t;
        uint32_t triangle_idx = node.triangle_indices[i];
        uint32_t mesh_idx = node.mesh_indices[i];
        if (m_meshes[mesh_idx]->rayIntersect(triangle_idx, ray, u, v, t) && t < ray.maxt) {
            /* An intersection was found! Can terminate
               immediately if this is a shadow ray query */
            if (shadowRay)
                return true;
            ray.maxt = t;
            its.t = t;
            its.uv = Point2f(u, v);
            its.mesh = m_meshes[mesh_idx];
            hit_idx = triangle_idx;
            foundIntersection = true;
        }
    }

    if (node.child) {
        std::pair<Node*, float> children[8];
        Node* current_child = node.child;
        int i = 0;
        do {
            children[i] = std::pair<Node*, float>(current_child, current_child->bbox.distanceTo(ray.o));
            current_child = current_child->next;
            i++;
        } while (current_child);

        std::sort(children, children + 8, [ray](const std::pair<Node*, float>& l, const std::pair<Node*, float>& r) {
            return l.second < r.second;
        });

        for (auto child: children) {
            foundIntersection = traverseRecursive(*child.first, ray, its, shadowRay, hit_idx) || foundIntersection;
            if (shadowRay && foundIntersection)
                return true;
        }
    }
    return foundIntersection;
}

void Accel::subdivideBBox(const nori::BoundingBox3f &parent, nori::BoundingBox3f *bboxes) {
    Point3f extents = parent.getExtents();

    Point3f x0_y0_z0 = parent.min;
    Point3f x1_y0_z0 = Point3f(parent.min.x() + extents.x() / 2.f, parent.min.y(), parent.min.z());
    Point3f x0_y1_z0 = Point3f(parent.min.x(), parent.min.y() + extents.y() / 2.f, parent.min.z());
    Point3f x1_y1_z0 = Point3f(parent.min.x() + extents.x() / 2.f, parent.min.y() + extents.y() / 2.f, parent.min.z());

    Point3f x0_y0_z1 = Point3f(parent.min.x(), parent.min.y(), parent.min.z() + extents.z() / 2.f);
    Point3f x1_y0_z1 = Point3f(parent.min.x() + extents.x() / 2.f, parent.min.y(), parent.min.z() + extents.z() / 2.f);
    Point3f x0_y1_z1 = Point3f(parent.min.x(), parent.min.y() + extents.y() / 2.f, parent.min.z() + extents.z() / 2.f);
    Point3f x1_y1_z1 = Point3f(parent.min.x() + extents.x() / 2.f, parent.min.y() + extents.y() / 2.f, parent.min.z() + extents.z() / 2.f);
    Point3f x2_y1_z1 = Point3f(parent.max.x(), parent.min.y() + extents.y() / 2.f, parent.min.z() + extents.z() / 2.f);
    Point3f x1_y2_z1 = Point3f(parent.min.x() + extents.x() / 2.f, parent.max.y(), parent.min.z() + extents.z() / 2.f);
    Point3f x2_y2_z1 = Point3f(parent.max.x(), parent.max.y(), parent.min.z() + extents.z() / 2.f);

    Point3f x1_y1_z2 = Point3f(parent.min.x() + extents.x() / 2.f, parent.min.y() + extents.y() / 2.f, parent.max.z());
    Point3f x2_y1_z2 = Point3f(parent.max.x(), parent.min.y() + extents.y() / 2.f, parent.max.z());
    Point3f x1_y2_z2 = Point3f(parent.min.x() + extents.x() / 2.f, parent.max.y(), parent.max.z());
    Point3f x2_y2_z2 = Point3f(parent.max.x(), parent.max.y(), parent.max.z());

    bboxes[0] = BoundingBox3f(x0_y0_z0, x1_y1_z1);
    bboxes[1] = BoundingBox3f(x1_y0_z0, x2_y1_z1);
    bboxes[2] = BoundingBox3f(x0_y1_z0, x1_y2_z1);
    bboxes[3] = BoundingBox3f(x1_y1_z0, x2_y2_z1);
    bboxes[4] = BoundingBox3f(x0_y0_z1, x1_y1_z2);
    bboxes[5] = BoundingBox3f(x1_y0_z1, x2_y1_z2);
    bboxes[6] = BoundingBox3f(x0_y1_z1, x1_y2_z2);
    bboxes[7] = BoundingBox3f(x1_y1_z1, x2_y2_z2);
}

NORI_NAMESPACE_END

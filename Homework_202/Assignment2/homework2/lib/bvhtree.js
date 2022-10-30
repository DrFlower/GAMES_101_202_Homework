/**
 * bvh-tree
 * A Bounding Volume Hierarchy data structure implementation.
 * https://github.com/benraziel/bvh-tree
 *
 * @author Ben Raziel
 */
var bvhtree = bvhtree || {};
bvhtree.EPSILON = 1e-6;

/**
 * A 3D Vector class. Based on three.js Vector3
 */
bvhtree.BVHVector3 = function ( x, y, z ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

};

bvhtree.BVHVector3.prototype = {

    constructor: bvhtree.BVHVector3,

    copy: function ( v ) {

        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;

    },

    set: function ( x, y, z ) {

        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    },

    setFromArray: function(array, firstElementPos) {
        this.x = array[firstElementPos];
        this.y = array[firstElementPos+1];
        this.z = array[firstElementPos+2];
    },

    add: function ( v ) {

        this.x += v.x;
        this.y += v.y;
        this.z += v.z;

        return this;
    },

    multiplyScalar: function ( scalar ) {

        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;

        return this;

    },

    subVectors: function ( a, b ) {

        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;

        return this;

    },

    dot: function ( v ) {

        return this.x * v.x + this.y * v.y + this.z * v.z;

    },

    cross: function ( v ) {
        var x = this.x, y = this.y, z = this.z;

        this.x = y * v.z - z * v.y;
        this.y = z * v.x - x * v.z;
        this.z = x * v.y - y * v.x;

        return this;
    },

    crossVectors: function ( a, b ) {

        var ax = a.x, ay = a.y, az = a.z;
        var bx = b.x, by = b.y, bz = b.z;

        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;

        return this;
    },

    clone: function () {
        return new bvhtree.BVHVector3( this.x, this.y, this.z );
    }
};

/**
 * @typedef {Object} Point A Point in 3D space
 * @property {number} x x coordinate of the point
 * @property {number} y y coordinate of the point
 * @property {number} z z coordinate of the point
 *
 * @typedef Point[3] Triangle A triangle in 3D space
 */

/**
 * Constructs a bounding volume heirarchy from a list of triangles
 * @class
 * @param {Triangle[]} triangles an array of triangles to index. Each triangle is represented as an array of 3 xyz coordinates: [{x: X0, y: Y0, z: Z0}, {x: X1, y: Y1, z: Z1}, {x: X2, y: Y2, z: Z2}]
 * @param {number} [maxTrianglesPerNode=10] the maximum number of triangles in each node of the BVH tree. Once this value is reached, that node is split into two child nodes.
 */
bvhtree.BVH = function(triangles, maxTrianglesPerNode) {
    var trianglesArray = [];
    trianglesArray.length = triangles.length * 9;

    for (var i = 0; i < triangles.length; i++) {
        var p0 = triangles[i][0];
        var p1 = triangles[i][1];
        var p2 = triangles[i][2];

        trianglesArray[i*9] = p0.x;
        trianglesArray[i*9+1] = p0.y;
        trianglesArray[i*9+2] = p0.z;

        trianglesArray[i*9+3] = p1.x;
        trianglesArray[i*9+4] = p1.y;
        trianglesArray[i*9+5] = p1.z;

        trianglesArray[i*9+6] = p2.x;
        trianglesArray[i*9+7] = p2.y;
        trianglesArray[i*9+8] = p2.z;
    }


    this._trianglesArray = trianglesArray;
    this._maxTrianglesPerNode = maxTrianglesPerNode || 10;
    this._bboxArray = this.calcBoundingBoxes(trianglesArray);

    // clone a helper array
    this._bboxHelper = new Float32Array(this._bboxArray.length);
    this._bboxHelper.set(this._bboxArray);

    // create the root node, add all the triangles to it
    var triangleCount = trianglesArray.length / 9;
    var extents = this.calcExtents(0, triangleCount, bvhtree.EPSILON);
    this._rootNode = new bvhtree.BVHNode(extents[0], extents[1], 0, triangleCount, 0);

    this._nodesToSplit = [this._rootNode];

    while (this._nodesToSplit.length > 0) {
        var node = this._nodesToSplit.pop();
        this.splitNode(node);
    }
};

/**
 * returns a list of all the triangles in the BVH which interected a specific node.
 * We use the BVH node structure to first cull out nodes which do not intereset the ray.
 * For rays that did intersect, we test intersection of the ray with each triangle
 * @param {Point} rayOrigin the origin position of the ray.
 * @param {Point} rayDirection the direction vector of the ray.
 * @param {Boolean} backfaceCulling if 'true', only intersections with front-faces of the mesh will be performed.
 * @return IntersectionResult[] an array of intersection result, one for each triangle which intersected the BVH
 *
 * @typedef {Object} IntersectionResult
 * @property Array[] triangle the triangle which the ray intersected
 * @property number triangleIndex the position of the interescting triangle in the input triangle array provided to the BVH constructor.
 * @property {Point} intersectionPoint the interesection point of the ray on the triangle.
 */
bvhtree.BVH.prototype.intersectRay = function(rayOrigin, rayDirection, backfaceCulling) {
    var nodesToIntersect = [this._rootNode];
    var trianglesInIntersectingNodes = []; // a list of nodes that intersect the ray (according to their bounding box)
    var intersectingTriangles = [];
    var i;

    var invRayDirection = new bvhtree.BVHVector3(
        1.0 / rayDirection.x,
        1.0 / rayDirection.y,
        1.0 / rayDirection.z
    );

    // go over the BVH tree, and extract the list of triangles that lie in nodes that intersect the ray.
    // note: these triangles may not intersect the ray themselves
    while (nodesToIntersect.length > 0) {
        var node = nodesToIntersect.pop();

        if (bvhtree.BVH.intersectNodeBox(rayOrigin, invRayDirection, node)) {
            if (node._node0) {
                nodesToIntersect.push(node._node0);
            }

            if (node._node1) {
                nodesToIntersect.push(node._node1);
            }

            for (i = node._startIndex; i < node._endIndex; i++) {
                trianglesInIntersectingNodes.push(this._bboxArray[i*7]);
            }
        }
    }

    // go over the list of candidate triangles, and check each of them using ray triangle intersection
    var a = new bvhtree.BVHVector3();
    var b = new bvhtree.BVHVector3();
    var c = new bvhtree.BVHVector3();
    var rayOriginVec3 = new bvhtree.BVHVector3(rayOrigin.x, rayOrigin.y, rayOrigin.z);
    var rayDirectionVec3 = new bvhtree.BVHVector3(rayDirection.x, rayDirection.y, rayDirection.z);

    for (i = 0; i < trianglesInIntersectingNodes.length; i++) {
        var triIndex = trianglesInIntersectingNodes[i];

        a.setFromArray(this._trianglesArray, triIndex*9);
        b.setFromArray(this._trianglesArray, triIndex*9+3);
        c.setFromArray(this._trianglesArray, triIndex*9+6);

        var intersectionPoint = bvhtree.BVH.intersectRayTriangle(a, b, c, rayOriginVec3, rayDirectionVec3, backfaceCulling);

        if (intersectionPoint) {
            intersectingTriangles.push({
                triangle: [a.clone(), b.clone(), c.clone()],
                triangleIndex: triIndex,
                intersectionPoint: intersectionPoint
            });
        }
    }

    return intersectingTriangles;
};

/**
 * Gets an array of triangle, and calculates the bounding box for each of them, and adds an index to the triangle's position in the array
 * Each bbox is saved as 7 values in a Float32Array: (position, minX, minY, minZ, maxX, maxY, maxZ)
 */
bvhtree.BVH.prototype.calcBoundingBoxes = function(trianglesArray) {
    var p0x, p0y, p0z;
    var p1x, p1y, p1z;
    var p2x, p2y, p2z;
    var minX, minY, minZ;
    var maxX, maxY, maxZ;

    var triangleCount = trianglesArray.length / 9;
    var bboxArray = new Float32Array(triangleCount * 7);

    for (var i = 0; i < triangleCount; i++) {
        p0x = trianglesArray[i*9];
        p0y = trianglesArray[i*9+1];
        p0z = trianglesArray[i*9+2];
        p1x = trianglesArray[i*9+3];
        p1y = trianglesArray[i*9+4];
        p1z = trianglesArray[i*9+5];
        p2x = trianglesArray[i*9+6];
        p2y = trianglesArray[i*9+7];
        p2z = trianglesArray[i*9+8];

        minX = Math.min(Math.min(p0x, p1x), p2x);
        minY = Math.min(Math.min(p0y, p1y), p2y);
        minZ = Math.min(Math.min(p0z, p1z), p2z);
        maxX = Math.max(Math.max(p0x, p1x), p2x);
        maxY = Math.max(Math.max(p0y, p1y), p2y);
        maxZ = Math.max(Math.max(p0z, p1z), p2z);

        bvhtree.BVH.setBox(bboxArray, i, i, minX, minY, minZ, maxX, maxY, maxZ);
    }

    return bboxArray;
};

/**
 * Calculates the extents (i.e the min and max coordinates) of a list of bounding boxes in the bboxArray
 * @param startIndex the index of the first triangle that we want to calc extents for
 * @param endIndex the index of the last triangle that we want to calc extents for
 * @param expandBy a small epsilon to expand the bbox by, for safety during ray-box intersections
 */
bvhtree.BVH.prototype.calcExtents = function(startIndex, endIndex, expandBy) {
    expandBy = expandBy || 0.0;

    if (startIndex >= endIndex) {
        return [{'x': 0, 'y': 0, 'z': 0}, {'x': 0, 'y': 0, 'z': 0}];
    }

    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;
    var minZ = Number.MAX_VALUE;
    var maxX = -Number.MAX_VALUE;
    var maxY = -Number.MAX_VALUE;
    var maxZ = -Number.MAX_VALUE;

    for (var i = startIndex; i < endIndex; i++) {
        minX = Math.min(this._bboxArray[i*7+1], minX);
        minY = Math.min(this._bboxArray[i*7+2], minY);
        minZ = Math.min(this._bboxArray[i*7+3], minZ);
        maxX = Math.max(this._bboxArray[i*7+4], maxX);
        maxY = Math.max(this._bboxArray[i*7+5], maxY);
        maxZ = Math.max(this._bboxArray[i*7+6], maxZ);
    }

    return [
        {'x': minX - expandBy, 'y': minY - expandBy, 'z': minZ - expandBy},
        {'x': maxX + expandBy, 'y': maxY + expandBy, 'z': maxZ + expandBy}
    ];
};

bvhtree.BVH.prototype.splitNode = function(node) {
    if ((node.elementCount() <= this._maxTrianglesPerNode) || (node.elementCount() === 0)) {
        return;
    }

    var startIndex = node._startIndex;
    var endIndex = node._endIndex;

    var leftNode = [ [],[],[] ];
    var rightNode = [ [],[],[] ];
    var extentCenters = [node.centerX(), node.centerY(), node.centerZ()];

    var extentsLength = [
        node._extentsMax.x - node._extentsMin.x,
        node._extentsMax.y - node._extentsMin.y,
        node._extentsMax.z - node._extentsMin.z
    ];

    var objectCenter = [];
    objectCenter.length = 3;

    for (var i = startIndex; i < endIndex; i++) {
        objectCenter[0] = (this._bboxArray[i * 7 + 1] + this._bboxArray[i * 7 + 4]) * 0.5; // center = (min + max) / 2
        objectCenter[1] = (this._bboxArray[i * 7 + 2] + this._bboxArray[i * 7 + 5]) * 0.5; // center = (min + max) / 2
        objectCenter[2] = (this._bboxArray[i * 7 + 3] + this._bboxArray[i * 7 + 6]) * 0.5; // center = (min + max) / 2

        for (var j = 0; j < 3; j++) {
            if (objectCenter[j] < extentCenters[j]) {
                leftNode[j].push(i);
            }
            else {
                rightNode[j].push(i);
            }
        }
    }

    // check if we couldn't split the node by any of the axes (x, y or z). halt here, dont try to split any more (cause it will always fail, and we'll enter an infinite loop
    var splitFailed = [];
    splitFailed.length = 3;

    splitFailed[0] = (leftNode[0].length === 0) || (rightNode[0].length === 0);
    splitFailed[1] = (leftNode[1].length === 0) || (rightNode[1].length === 0);
    splitFailed[2] = (leftNode[2].length === 0) || (rightNode[2].length === 0);

    if (splitFailed[0] && splitFailed[1] && splitFailed[2]) {
        return;
    }

    // choose the longest split axis. if we can't split by it, choose next best one.
    var splitOrder = [0, 1, 2];

    splitOrder.sort(function(axis0, axis1) {
        return (extentsLength[axis1] - extentsLength[axis0])
    });

    var leftElements;
    var rightElements;

    for (j = 0; j < 3; j++) {
        var candidateIndex = splitOrder[j];

        if (!splitFailed[candidateIndex]) {
            leftElements = leftNode[candidateIndex];
            rightElements = rightNode[candidateIndex];

            break;
        }
    }

    // sort the elements in range (startIndex, endIndex) according to which node they should be at
    var node0Start = startIndex;
    var node0End = node0Start + leftElements.length;
    var node1Start = node0End;
    var node1End = endIndex;
    var currElement;

    var helperPos = node._startIndex;
    var concatenatedElements = leftElements.concat(rightElements);

    for (i = 0; i < concatenatedElements.length; i++) {
        currElement = concatenatedElements[i];
        bvhtree.BVH.copyBox(this._bboxArray, currElement, this._bboxHelper, helperPos);
        helperPos++;
    }

    // copy results back to main array
    var subArr = this._bboxHelper.subarray(node._startIndex * 7, node._endIndex * 7);
    this._bboxArray.set(subArr, node._startIndex * 7);

    // create 2 new nodes for the node we just split, and add links to them from the parent node
    var node0Extents = this.calcExtents(node0Start, node0End, bvhtree.EPSILON);
    var node1Extents = this.calcExtents(node1Start, node1End, bvhtree.EPSILON);

    var node0 = new bvhtree.BVHNode(node0Extents[0], node0Extents[1], node0Start, node0End, node._level + 1);
    var node1 = new bvhtree.BVHNode(node1Extents[0], node1Extents[1], node1Start, node1End, node._level + 1);

    node._node0 = node0;
    node._node1 = node1;
    node.clearShapes();

    // add new nodes to the split queue
    this._nodesToSplit.push(node0);
    this._nodesToSplit.push(node1);
};

bvhtree.BVH._calcTValues = function(minVal, maxVal, rayOriginCoord, invdir) {
    var res = {min: 0, max: 0};

    if ( invdir >= 0 ) {
        res.min = ( minVal - rayOriginCoord ) * invdir;
        res.max = ( maxVal - rayOriginCoord ) * invdir;

    } else {
        res.min = ( maxVal - rayOriginCoord ) * invdir;
        res.max = ( minVal - rayOriginCoord ) * invdir;
    }

    return res;
};

bvhtree.BVH.intersectNodeBox = function(rayOrigin, invRayDirection, node) {
    var t = bvhtree.BVH._calcTValues(node._extentsMin.x, node._extentsMax.x, rayOrigin.x, invRayDirection.x);
    var ty = bvhtree.BVH._calcTValues(node._extentsMin.y, node._extentsMax.y, rayOrigin.y, invRayDirection.y);

    if ( ( t.min > ty.max ) || ( ty.min > t.max ) ) {
        return false;
    }

    // These lines also handle the case where tmin or tmax is NaN
    // (result of 0 * Infinity). x !== x returns true if x is NaN
    if ( ty.min > t.min || t.min !== t.min ) {
        t.min = ty.min;
    }

    if ( ty.max < t.max || t.max !== t.max ) {
        t.max = ty.max;
    }

    var tz = bvhtree.BVH._calcTValues(node._extentsMin.z, node._extentsMax.z, rayOrigin.z, invRayDirection.z);

    if ( ( t.min > tz.max ) || ( tz.min > t.max ) ) {
        return false;
    }

    if ( tz.min > t.min || t.min !== t.min ) {
        t.min = tz.min;
    }

    if ( tz.max < t.max || t.max !== t.max ) {
        t.max = tz.max;
    }

    //return point closest to the ray (positive side)
    if (t.max < 0 ) {
        return false;
    }

    return true;
};

bvhtree.BVH.intersectRayTriangle = (function () {
    // Compute the offset origin, edges, and normal.
    var diff = new bvhtree.BVHVector3();
    var edge1 = new bvhtree.BVHVector3();
    var edge2 = new bvhtree.BVHVector3();
    var normal = new bvhtree.BVHVector3();

    return function (a, b, c, rayOrigin, rayDirection, backfaceCulling) {

        // from http://www.geometrictools.com/LibMathematics/Intersection/Wm5IntrRay3Triangle3.cpp

        edge1.subVectors(b, a);
        edge2.subVectors(c, a);
        normal.crossVectors(edge1, edge2);

        // Solve Q + t*D = b1*E1 + bL*E2 (Q = kDiff, D = ray direction,
        // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
        //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
        //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
        //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
        var DdN = rayDirection.dot(normal);
        var sign;

        if (DdN > 0) {

            if (backfaceCulling) {
                return null;
            }

            sign = 1;

        } else if (DdN < 0) {

            sign = -1;
            DdN = -DdN;

        } else {

            return null;

        }

        diff.subVectors(rayOrigin, a);
        var DdQxE2 = sign * rayDirection.dot(edge2.crossVectors(diff, edge2));

        // b1 < 0, no intersection
        if (DdQxE2 < 0) {
            return null;
        }

        var DdE1xQ = sign * rayDirection.dot(edge1.cross(diff));

        // b2 < 0, no intersection
        if (DdE1xQ < 0) {
            return null;
        }

        // b1+b2 > 1, no intersection
        if (DdQxE2 + DdE1xQ > DdN) {
            return null;
        }

        // Line intersects triangle, check if ray does.
        var QdN = -sign * diff.dot(normal);

        // t < 0, no intersection
        if (QdN < 0) {
            return null;
        }

        // Ray intersects triangle.
        var t = QdN / DdN;
        var result = new bvhtree.BVHVector3();
        return result.copy( rayDirection ).multiplyScalar( t ).add( rayOrigin );
    };
}());

bvhtree.BVH.setBox = function(bboxArray, pos, triangleId, minX, minY, minZ, maxX, maxY, maxZ) {
    bboxArray[pos*7] = triangleId;
    bboxArray[pos*7+1] = minX;
    bboxArray[pos*7+2] = minY;
    bboxArray[pos*7+3] = minZ;
    bboxArray[pos*7+4] = maxX;
    bboxArray[pos*7+5] = maxY;
    bboxArray[pos*7+6] = maxZ;
};

bvhtree.BVH.copyBox = function(sourceArray, sourcePos, destArray, destPos) {
    destArray[destPos*7] = sourceArray[sourcePos*7];
    destArray[destPos*7+1] = sourceArray[sourcePos*7+1];
    destArray[destPos*7+2] = sourceArray[sourcePos*7+2];
    destArray[destPos*7+3] = sourceArray[sourcePos*7+3];
    destArray[destPos*7+4] = sourceArray[sourcePos*7+4];
    destArray[destPos*7+5] = sourceArray[sourcePos*7+5];
    destArray[destPos*7+6] = sourceArray[sourcePos*7+6];
};

bvhtree.BVH.getBox = function(bboxArray, pos, outputBox) {
    outputBox.triangleId = bboxArray[pos*7];
    outputBox.minX = bboxArray[pos*7+1];
    outputBox.minY = bboxArray[pos*7+2];
    outputBox.minZ = bboxArray[pos*7+3];
    outputBox.maxX = bboxArray[pos*7+4];
    outputBox.maxY = bboxArray[pos*7+5];
    outputBox.maxZ = bboxArray[pos*7+6];
};


/**
 * A node in the BVH structure
 * @class
 * @param {Point} extentsMin the min coords of this node's bounding box ({x,y,z})
 * @param {Point} extentsMax the max coords of this node's bounding box ({x,y,z})
 * @param {number} startIndex an index in the bbox array, where the first element of this node is located
 * @param {number} endIndex an index in the bbox array, where the last of this node is located, plus 1 (meaning that its non-inclusive).
 * @param {number} the distance of this node from the root for the bvh tree. root node has level=0, its children have level=1 etc.
 */
bvhtree.BVHNode = function(extentsMin, extentsMax, startIndex, endIndex, level) {
    this._extentsMin = extentsMin;
    this._extentsMax = extentsMax;
    this._startIndex = startIndex;
    this._endIndex = endIndex;
    this._level = level;
    this._node0 = null;
    this._node1 = null;
};

bvhtree.BVHNode.prototype.elementCount = function() {
    return this._endIndex - this._startIndex;
};

bvhtree.BVHNode.prototype.centerX = function() {
    return (this._extentsMin.x + this._extentsMax.x) * 0.5;
};

bvhtree.BVHNode.prototype.centerY = function() {
    return (this._extentsMin.y + this._extentsMax.y) * 0.5;
};

bvhtree.BVHNode.prototype.centerZ = function() {
    return (this._extentsMin.z + this._extentsMax.z) * 0.5;
};

bvhtree.BVHNode.prototype.clearShapes = function() {
    this._startIndex = -1;
    this._endIndex = -1;
};

bvhtree.BVHNode.calcBoundingSphereRadius = function(extentsMin, extentsMax) {
    var centerX = (extentsMin.x + extentsMax.x) * 0.5;
    var centerY = (extentsMin.y + extentsMax.y) * 0.5;
    var centerZ = (extentsMin.z + extentsMax.z) * 0.5;

    var extentsMinDistSqr =
        (centerX - extentsMin.x) * (centerX - extentsMin.x) +
        (centerY - extentsMin.y) * (centerY - extentsMin.y) +
        (centerZ - extentsMin.z) * (centerZ - extentsMin.z);

    var extentsMaxDistSqr =
        (centerX - extentsMax.x) * (centerX - extentsMax.x) +
        (centerY - extentsMax.y) * (centerY - extentsMax.y) +
        (centerZ - extentsMax.z) * (centerZ - extentsMax.z);

    return Math.sqrt(Math.max(extentsMinDistSqr, extentsMaxDistSqr));
};

// commonjs module definiton
if (typeof module !== 'undefined' && module.exports) {
    module.exports.BVH = bvhtree.BVH;
    module.exports.intersectRay = bvhtree.intersectRay;
}

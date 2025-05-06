function vec3(x, y, z) {
    return {
      x: x,
      y: y,
      z: z,
    }
  }

//   function vec3(arr) {
//     return {
//         x: arr[0],
//         y: arr[1],
//         z: arr[2],
//     }
//   }

  function addVectors(vec1, vec2) {
    return vec3(vec1.x + vec2.x, vec1.y + vec2.y, vec1.z + vec2.z);
  }

function dotProduct(v1, v2) {
    return (v1.x*v2.x)+(v1.y*v2.y)+(v1.z*v2.z);
  }

  function scaleVector(vector, scalar) {
    return vec3(vector.x * scalar, vector.y * scalar, vector.z * scalar);
  }
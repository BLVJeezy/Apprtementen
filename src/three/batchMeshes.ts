import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
/** Static local meshes sharing a material can be drawn together without changing their shape. */
export function batchMeshes(group: THREE.Group) {
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  for (const child of group.children) {
    if (
      !(child instanceof THREE.Mesh) ||
      child instanceof THREE.InstancedMesh ||
      Array.isArray(child.material)
    )
      continue;
    const meshes = batches.get(child.material) || [];
    meshes.push(child);
    batches.set(child.material, meshes);
  }
  for (const [material, meshes] of batches) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map((mesh) => {
      mesh.updateMatrix();
      return mesh.geometry.clone().applyMatrix4(mesh.matrix);
    });
    const geometry = mergeGeometries(geometries);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    const combined = new THREE.Mesh(geometry, material);
    combined.castShadow = meshes.some((m) => m.castShadow);
    combined.receiveShadow = meshes.some((m) => m.receiveShadow);
    for (const mesh of meshes) {
      group.remove(mesh);
      mesh.geometry.dispose();
    }
    group.add(combined);
  }
  return group;
}

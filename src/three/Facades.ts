import { batchMeshes } from "./batchMeshes";
import * as THREE from "three";
export type FacadeElement = {
  face: string;
  level: number;
  axis: number;
  depth: number;
  width: number;
  bottom: number;
  top: number;
  railing: boolean;
  divisions: number[];
};
export function createFacades(
  elements: FacadeElement[],
  level: number,
  brick: THREE.Material,
  frame: THREE.Material,
) {
  const group = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x8a9fa5,
    roughness: 0.07,
    metalness: 0.4,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.8,
  });
  for (const e of elements.filter((e) => e.level === level)) {
    const alongX = e.face === "front" || e.face === "rear";
    const inward = e.face === "front" || e.face === "right" ? -1 : 1;
    const plane = e.depth + inward * (e.railing ? 0.035 : 0.16);
    const add = (
      u: number,
      y: number,
      width: number,
      height: number,
      thickness: number,
      mat: THREE.Material,
    ) => {
      if (height <= 0 || width <= 0) return;
      const geometry = new THREE.BoxGeometry(
        alongX ? width : thickness,
        height,
        alongX ? thickness : width,
      );
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(
        alongX ? e.axis + u : plane,
        y,
        alongX ? plane : e.axis + u,
      );
      if (mat === brick) {
        const p = geometry.getAttribute("position"),
          uv = geometry.getAttribute("uv");
        for (let i = 0; i < p.count; i++)
          uv.setXY(
            i,
            (alongX
              ? p.getX(i) + mesh.position.x
              : p.getZ(i) + mesh.position.z) / 4.59,
            (p.getY(i) + y) / 1.5,
          );
      }
      mesh.castShadow = mat !== glass;
      mesh.receiveShadow = true;
      group.add(mesh);
    };
    const h = e.top - e.bottom,
      mid = (e.top + e.bottom) / 2;
    add(0, mid, e.width - 0.065, h - 0.065, 0.025, glass);
    for (const x of [-e.width / 2 + 0.025, e.width / 2 - 0.025, ...e.divisions])
      add(x, mid, 0.05, h, 0.075, frame);
    for (const y of [e.bottom + 0.025, e.top - 0.025])
      add(0, y, e.width, 0.05, 0.075, frame);
    if (e.railing) {
      // Wide continuous railings use source one-metre-height glass, with slender support posts.
      const count = Math.ceil(e.width / 1.3);
      for (let n = 1; n < count; n++)
        add(-e.width / 2 + (e.width * n) / count, mid, 0.025, h, 0.04, frame);
    } else {
      const base = level * 2.85,
        ceiling = level === 2 ? 8 : base + 2.85;
      add(0, (base + e.bottom) / 2, e.width, e.bottom - base, 0.32, brick);
      add(0, (e.top + ceiling) / 2, e.width, ceiling - e.top, 0.32, brick);
      add(0, e.bottom - 0.025, e.width + 0.06, 0.045, 0.38, frame);
    }
  }
  return batchMeshes(group);
}

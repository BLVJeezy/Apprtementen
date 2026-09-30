import { batchMeshes } from "./batchMeshes";
import * as THREE from "three";
// Context composition follows the supplied aerial reference and site plan.
// Neighbouring-building heights, planting and surface finishes are indicative.
export function siteContext(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = "site-context";
  let seed = 179;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  function material(color: string, paving = false) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 18000; i++) {
      ctx.fillStyle = rand() > 0.5 ? "#ffffff15" : "#00000018";
      ctx.fillRect(rand() * 256, rand() * 256, 1 + rand() * 2, 1 + rand() * 2);
    }
    if (paving) {
      ctx.strokeStyle = "#494a4438";
      ctx.lineWidth = 1;
      for (let y = 0; y < 256; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
        for (let x = y % 64 ? 16 : 0; x < 256; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 32);
          ctx.stroke();
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({
      map: t,
      roughness: 0.92,
      bumpMap: t,
      bumpScale: 0.012,
    });
  }
  const asphalt = material("#626463"),
    pavers = material("#b7b1a5", true),
    cycle = material("#997a70"),
    white = new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.8 }),
    hedge = new THREE.MeshStandardMaterial({ color: 0x415834, roughness: 1 });
  const cube = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: THREE.Material,
  ) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.getAttribute("uv"),
      p = g.getAttribute("position"),
      n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i++)
      uv.setXY(
        i,
        Math.abs(n.getY(i)) > 0.5 ? p.getX(i) / 2 : p.getX(i) / 3,
        Math.abs(n.getY(i)) > 0.5 ? p.getZ(i) / 2 : p.getY(i) / 3,
      );
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = h > 0.2;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  cube(160, 0.1, 7.4, 20, -0.22, 31.2, asphalt);
  cube(160, 0.08, 1.6, 20, -0.14, 26.7, cycle);
  cube(160, 0.12, 2.2, 20, -0.1, 24.8, pavers);
  cube(160, 0.14, 0.16, 20, -0.08, 23.62, white);
  for (const z of [27.6, 34.8]) cube(160, 0.012, 0.12, 20, -0.158, z, white);
  for (let x = -60; x < 100; x += 6)
    cube(3, 0.012, 0.12, x, -0.158, 31.2, white);
  cube(4.6, 0.15, 41, 43.8, -0.09, 5, pavers);
  cube(1.8, 0.1, 6.7, 20, -0.06, 20.25, pavers);
  for (const x of [5, 14, 26, 35]) cube(6, 0.08, 2.2, x, -0.06, 18.2, pavers);
  // Low clipped hedges with leaf silhouettes, leaving the central access open.
  const leaves = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.13, 0),
    hedge,
    4000,
  );
  const matrix = new THREE.Object3D();
  for (let i = 0; i < 4000; i++) {
    let x = rand() * 40;
    if (x > 18.7 && x < 21.3) x += 3;
    matrix.position.set(x, 0.1 + rand() * 0.72, 22.65 + (rand() - 0.5) * 0.65);
    matrix.scale.set(1.3, 0.8, 1);
    matrix.rotation.y = rand() * 6;
    matrix.updateMatrix();
    leaves.setMatrixAt(i, matrix.matrix);
    leaves.setColorAt(
      i,
      new THREE.Color().setHSL(
        0.23 + rand() * 0.05,
        0.32,
        0.16 + rand() * 0.13,
      ),
    );
  }
  leaves.castShadow = true;
  group.add(leaves);
  // Right industrial neighbour, set outside the project footprint.
  const industrial = new THREE.MeshStandardMaterial({
    color: 0xaeb5b5,
    roughness: 0.65,
    metalness: 0.2,
  });
  cube(20, 6.4, 38, 60, 3.0, -1, industrial);
  cube(20.3, 0.16, 38.3, 60, 6.27, -1, white);
  for (let z = -20; z < 18; z += 0.65)
    cube(0.07, 6.2, 0.035, 49.96, 3, z, white);
  for (let z = -15; z < 15; z += 7) cube(2, 0.13, 3, 58, 6.4, z, white);
  // Detached neighbour to the left; no asserted surveyed dimensions.
  cube(
    8,
    5.2,
    10,
    -10,
    2.4,
    8,
    new THREE.MeshStandardMaterial({ color: 0xe2d8c2, roughness: 1 }),
  );
  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -14.4, 5, 2.6, -5.6, 5, 2.6, -10, 8, 2.6, -14.4, 5, 13.4, -10, 8, 13.4,
        -5.6, 5, 13.4, -14.4, 5, 2.6, -10, 8, 2.6, -10, 8, 13.4, -14.4, 5, 2.6,
        -10, 8, 13.4, -14.4, 5, 13.4, -10, 8, 2.6, -5.6, 5, 2.6, -5.6, 5, 13.4,
        -10, 8, 2.6, -5.6, 5, 13.4, -10, 8, 13.4,
      ],
      3,
    ),
  );
  roofGeo.computeVertexNormals();
  const roof = new THREE.Mesh(
    roofGeo,
    new THREE.MeshStandardMaterial({
      color: 0x454a4b,
      roughness: 0.86,
      side: THREE.DoubleSide,
    }),
  );
  roof.castShadow = true;
  group.add(roof);
  scene.add(batchMeshes(group));
}

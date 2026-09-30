import { batchMeshes } from "./batchMeshes";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { siteContext } from "./SiteContext";
import { createFacades, type FacadeElement } from "./Facades";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type {
  Architecture,
  FloorGeometry,
  Polygon,
  SceneMode,
  SceneCommand,
} from "./types";
export type SceneCanvasProps = {
  mode: SceneMode;
  level: number;
  apartment: string;
  movement?: { x: number; y: number };
  command?: { id: number; action: SceneCommand };
  onFailure?: () => void;
  hero?: boolean;
  paused?: boolean;
};
const wallMat = new THREE.MeshStandardMaterial({
  color: 0xeee9de,
  roughness: 0.91,
});
// Slight buff tint pulls the source brick toward the supplied render's pale sand brick.
const brickMat = new THREE.MeshStandardMaterial({
  color: 0xd1c6af,
  roughness: 0.96,
});
const slabMat = new THREE.MeshStandardMaterial({
  color: 0xb9b3a3,
  roughness: 0.88,
});
const floorMat = new THREE.MeshStandardMaterial({
  color: 0xd7c7ab,
  roughness: 0.85,
  side: THREE.DoubleSide,
});
// Anthracite powder-coated aluminium for frames, fascia and coping.
const frameMat = new THREE.MeshStandardMaterial({
  color: 0x2e3133,
  roughness: 0.42,
  metalness: 0.45,
});
// Charcoal bitumen/EPDM roof membrane, matched to the supplied render.
const roofMat = new THREE.MeshStandardMaterial({
  color: 0x4a4d50,
  roughness: 0.96,
});
const fabricMat = new THREE.MeshStandardMaterial({
  color: 0xe8e4d7,
  roughness: 1,
});
const woodMat = new THREE.MeshStandardMaterial({
  color: 0x8c6c4b,
  roughness: 0.85,
});
function shapeFrom(polygon: Polygon) {
  const s = new THREE.Shape();
  polygon.outer.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  for (const points of polygon.holes) {
    const h = new THREE.Path();
    points.forEach(([x, z], i) => (i ? h.lineTo(x, -z) : h.moveTo(x, -z)));
    h.closePath();
    s.holes.push(h);
  }
  return s;
}
function extrude(
  polygons: Polygon[],
  height: number,
  base: number,
  mat: THREE.Material,
) {
  const geometries = polygons
    .filter((p) => p.outer.length > 2)
    .map((points) => {
      const g = new THREE.ExtrudeGeometry(shapeFrom(points), {
        depth: height,
        bevelEnabled: false,
        steps: 1,
      });
      g.rotateX(-Math.PI / 2);
      g.translate(0, base, 0);
      if (mat === brickMat) {
        const pos = g.getAttribute("position"),
          normal = g.getAttribute("normal"),
          uv = g.getAttribute("uv");
        for (let i = 0; i < pos.count; i++)
          uv.setXY(
            i,
            (Math.abs(normal.getX(i)) > 0.5 ? pos.getZ(i) : pos.getX(i)) / 4.59,
            pos.getY(i) / 1.5,
          );
      }
      return g;
    });
  if (!geometries.length) return new THREE.Group();
  const merged = mergeGeometries(geometries);
  geometries.forEach((g) => g.dispose());
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function box(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function furnishings(floor: FloorGeometry) {
  const g = new THREE.Group();
  for (const room of floor.rooms) {
    const t = room.label.toLowerCase();
    const { x, z } = room;
    const y = floor.elevation + 0.04;
    if (t.includes("slaapk")) {
      box(g, 1.45, 0.28, 2, x, y, z, fabricMat);
      box(g, 1.5, 0.8, 0.1, x, y, z - 1, woodMat);
      box(g, 1.3, 0.12, 0.4, x, y + 0.3, z - 0.65, fabricMat);
    } else if (t.includes("leefr")) {
      box(g, 2.15, 0.36, 0.85, x, y, z, fabricMat);
      box(g, 2.15, 0.4, 0.18, x, y + 0.36, z - 0.4, fabricMat);
      box(g, 0.15, 0.28, 0.85, x - 1, y + 0.36, z, fabricMat);
      box(g, 0.15, 0.28, 0.85, x + 1, y + 0.36, z, fabricMat);
      box(g, 1, 0.35, 0.55, x, y, z + 1.15, woodMat);
    } else if (t === "badk." || t === "badk") {
      box(g, 0.6, 0.8, 0.5, x, y, z, fabricMat);
    }
  }
  return batchMeshes(g);
}
function noiseTexture(
  base: [number, number, number],
  spread: number,
  size = 256,
  repeat = 1,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < size * size; i++) {
    const n = (rand() - 0.5) * spread;
    img.data.set(
      [base[0] + n, base[1] + n * 1.1, base[2] + n * 0.8, 255],
      i * 4,
    );
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function landscape(scene: THREE.Scene, bounds: number[]) {
  const [x0, z0, x1, z1] = bounds;
  const cx = (x0 + x1) / 2;
  const flat = (
    w: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
  ) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  flat(
    260,
    260,
    cx,
    -0.2,
    (z0 + z1) / 2,
    new THREE.MeshStandardMaterial({
      map: noiseTexture([112, 146, 80], 34, 256, 60),
      roughness: 1,
    }),
  );
  const grassCanvas = document.createElement("canvas");
  grassCanvas.width = grassCanvas.height = 512;
  const grassCtx = grassCanvas.getContext("2d")!;
  grassCtx.fillStyle = "#657343";
  grassCtx.fillRect(0, 0, 512, 512);
  let seed = 831;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  for (let i = 0; i < 65000; i++) {
    const v = 50 + Math.floor(random() * 50);
    grassCtx.strokeStyle = `rgba(${v + 10},${v + 27},${v - 12},.65)`;
    const x = random() * 512,
      y = random() * 512;
    grassCtx.beginPath();
    grassCtx.moveTo(x, y);
    grassCtx.lineTo(x + random() * 3, y - 2 - random() * 6);
    grassCtx.stroke();
  }
  const grassTexture = new THREE.CanvasTexture(grassCanvas);
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(60, 60);
  grassTexture.colorSpace = THREE.SRGBColorSpace;
  ground.material.map = grassTexture;
  ground.material.color.set(0xffffff);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((x0 + x1) / 2, -0.2, (z0 + z1) / 2);
  ground.receiveShadow = true;
  scene.add(ground);
  const green = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
  });
  const trunk = new THREE.MeshStandardMaterial({
    color: 0x6f5e48,
    roughness: 1,
  });
  // Decorative landscape outside the model, not a proposed plot or garden allocation.
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? -1 : 1;
    const x = (x0 + x1) / 2 + side * (28 + (i % 4) * 3);
    const z = z0 - 18 + Math.floor(i / 2) * 5;
    const h = 3.1 + (i % 3) * 0.7;
    const tree = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * spread, 0.14 * spread, h, 6),
      trunk,
    );
    stem.position.y = h / 2;
    stem.castShadow = shadow;
    group.add(stem);
    const crown = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.13, 0),
      green,
      700,
    );
    const transform = new THREE.Object3D();
    for (let k = 0; k < 700; k++) {
      const angle = k * 2.39996 + i;
      const height = random() * 2 - 1;
      const radius =
        1.85 * Math.sqrt(1 - height * height) * Math.cbrt(random());
      transform.position.set(
        Math.cos(angle) * radius,
        h + 0.5 + height * 1.9,
        Math.sin(angle) * radius,
      );
      transform.scale.set(0.7 + random(), 0.3 + random() * 0.4, 1.2 + random());
      transform.rotation.set(random() * 3, angle, random() * 3);
      transform.updateMatrix();
      crown.setMatrixAt(k, transform.matrix);
      // Brighter leaves near the top, shaded underneath.
      crown.setColorAt(
        k,
        new THREE.Color().setHSL(
          hue + (k % 3) * 0.01,
          0.4,
          0.2 + (lift / spread + 1.3) * 0.05 + (k % 4) * 0.012,
          THREE.SRGBColorSpace,
        ),
      );
    }
    crown.castShadow = shadow;
    group.add(crown);
    group.position.set(x, -0.2, z);
    scene.add(group);
  };
  // Decorative landscape outside the model, not a proposed plot or garden allocation.
  for (let i = 0; i < 22; i++) {
    const side = i % 2 ? -1 : 1;
    tree(
      cx + side * (28 + (i % 4) * 3.5) + Math.sin(i * 3.1) * 1.5,
      z0 - 18 + Math.floor(i / 2) * 5,
      3.1 + (i % 3) * 0.7,
      1 + (i % 4) * 0.12,
      i,
    );
  }
  siteContext(scene);
}
function inside(p: THREE.Vector3, polygon: Polygon) {
  const ring = (poly: number[][]) => {
    let yes = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, zi] = poly[i],
        [xj, zj] = poly[j];
      if (
        zi > p.z !== zj > p.z &&
        p.x < ((xj - xi) * (p.z - zi)) / (zj - zi) + xi
      )
        yes = !yes;
    }
    return yes;
  };
  return ring(polygon.outer) && !polygon.holes.some(ring);
}
export default function SceneCanvas({
  mode,
  level,
  apartment,
  command,
  movement = { x: 0, y: 0 },
  onFailure,
  hero = false,
  paused = false,
}: SceneCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const state = useRef({ mode, level, apartment, paused, movement });
  state.current = { mode, level, apartment, paused, movement };
  const api = useRef<{
    configure: () => void;
    command: (action: SceneCommand) => void;
  } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  useEffect(() => {
    if (!container.current) return;
    const holder: HTMLDivElement = container.current;
    let stopped = false;
    let disposed = false,
      frame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let scene: THREE.Scene | undefined;
    let resize: ResizeObserver | undefined;
    let visible = true;
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    visibility.observe(holder);
    const abort = new AbortController();
    const cleanupEvents: (() => void)[] = [];
    const fail = () => {
      if (!disposed) {
        stopped = true;
        cancelAnimationFrame(frame);
        setStatus("error");
        onFailure?.();
      }
    };
    async function init() {
      try {
        const response = await fetch("/models/architecture.json", {
          signal: abort.signal,
        });
        if (!response.ok) throw Error("Model unavailable");
        const data: Architecture = await response.json();
        const facadeResponse = await fetch("/models/facades.json", {
          signal: abort.signal,
        });
        if (!facadeResponse.ok) throw Error("Facade data unavailable");
        const facadeData: { elements: FacadeElement[] } =
          await facadeResponse.json();
        if (disposed) return;
        const surface = document.createElement("canvas");
        const context = surface.getContext("webgl2", {
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
        if (!context) throw Error("WebGL2 unavailable");
        renderer = new THREE.WebGLRenderer({
          canvas: surface,
          context,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        holder.appendChild(renderer.domElement);
        renderer.domElement.setAttribute(
          "aria-label",
          "Interactieve 3D architectuur",
        );
        renderer.domElement.setAttribute("role", "img");
        renderer.domElement.tabIndex = 0;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xd8e4e4);
        scene.fog = new THREE.Fog(0xd8e4e4, 85, 175);
        try {
          const hdr = await new RGBELoader().loadAsync(
            "/assets/environment/kloppenheim_06_1k.hdr",
          );
          if (disposed) {
            hdr.dispose();
            return;
          }
          hdr.mapping = THREE.EquirectangularReflectionMapping;
          const pmrem = new THREE.PMREMGenerator(renderer);
          const lighting = pmrem.fromEquirectangular(hdr);
          scene.environment = lighting.texture;
          scene.environmentIntensity = 0.85;
          scene.background = hdr;
          scene.backgroundIntensity = 0.8;
          scene.backgroundRotation.y = Math.PI * 0.7;
          scene.environmentRotation.y = Math.PI * 0.7;
          cleanupEvents.push(() => {
            lighting.dispose();
            hdr.dispose();
          });
          pmrem.dispose();
        } catch {
          /* Keep daylight fallback when the environment cannot load. */
        }
        scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x8c795f, 0.65));
        const sun = new THREE.DirectionalLight(0xfff3df, 2.1);
        sun.position.set(-30, 22, 38);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        Object.assign(sun.shadow.camera, {
          left: -50,
          right: 50,
          top: 45,
          bottom: -45,
          near: 1,
          far: 130,
        });
        sun.shadow.bias = -0.0003;
        sun.shadow.normalBias = 0.025;
        scene.add(sun);
        sun.target.position.set(20, 0, 8);
        scene.add(sun.target);
        const bounds = data.floors[0].bounds;
        const cx = (bounds[0] + bounds[2]) / 2,
          cz = (bounds[1] + bounds[3]) / 2;
        const camera = new THREE.PerspectiveCamera(43, 1, 0.06, 300);
        let drawFrames = 3;
        controls = new OrbitControls(camera, renderer.domElement);
        controls.addEventListener("change", () => {
          drawFrames = 3;
        });
        controls.enableDamping = true;
        controls.dampingFactor = 0.09;
        controls.minDistance = 4;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI * 0.49;
        controls.target.set(cx, 4, cz);
        controls.enablePan = true;
        if (!brickMat.map) {
          const texture = new THREE.TextureLoader().load(
            "/assets/materials/source-brick.webp",
          );
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy(),
          );
          brickMat.map = texture;
          brickMat.bumpMap = texture;
          brickMat.bumpScale = 0.035;
          brickMat.needsUpdate = true;
        }
        if (!floorMat.map) {
          const textureCanvas = document.createElement("canvas");
          textureCanvas.width = 512;
          textureCanvas.height = 512;
          const ctx = textureCanvas.getContext("2d")!;
          for (let row = 0; row < 12; row++) {
            for (let column = -1; column < 4; column++) {
              const shade = 174 + ((row * 17 + column * 13 + 52) % 22);
              ctx.fillStyle = `rgb(${shade + 25},${shade + 7},${shade - 21})`;
              const x = column * 170 + (row % 2) * 85;
              ctx.fillRect(x, row * 43, 169, 42);
              ctx.fillStyle = "rgba(75,50,25,.06)";
              for (let grain = 0; grain < 9; grain++)
                ctx.fillRect(
                  x + 4 + ((grain * 31) % 120),
                  row * 43 + grain * 4 + 3,
                  40 + ((grain * 13) % 70),
                  1,
                );
            }
          }
          const texture = new THREE.CanvasTexture(textureCanvas);
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(0.25, 0.25);
          texture.colorSpace = THREE.SRGBColorSpace;
          floorMat.map = texture;
          floorMat.color.set(0xffffff);
          floorMat.needsUpdate = true;
        }
        const ceilingMat = new THREE.MeshStandardMaterial({
          color: 0xf4f1e9,
          roughness: 1,
          side: THREE.DoubleSide,
        });
        const floorGroups: THREE.Group[] = [];
        for (const floor of data.floors) {
          const g = new THREE.Group();
          g.userData.level = floor.level;
          const polys =
            floor.slabPolygons ||
            floor.floorPolygons?.flatMap((p) => p.polygons) ||
            [];
          g.add(
            extrude(
              polys,
              floor.level === 0 ? 0.45 : 0.35,
              floor.elevation - (floor.level === 0 ? 0.45 : 0.35),
              slabMat,
            ),
          );
          g.add(extrude(polys, 0.012, floor.elevation + 0.005, slabMat));
          g.add(
            extrude(
              floor.ceilingPolygons || [],
              0.012,
              floor.elevation + 0.019,
              floorMat,
            ),
          );
          if (floor.exposedRoofPolygons?.length) {
            const cap = extrude(
              floor.exposedRoofPolygons,
              0.16,
              floor.elevation + 2.69,
              slabMat,
            );
            cap.name = "exposed-roof";
            g.add(cap);
          }
          g.add(
            extrude(
              floor.wallPolygons,
              floor.wallHeight,
              floor.elevation,
              wallMat,
            ),
          );
          g.add(
            extrude(
              floor.facadePolygons,
              floor.level === 2 ? 2.3 : 2.85,
              floor.elevation,
              brickMat,
            ),
          );
          if (floor.ceilingPolygons?.length) {
            const ceiling = extrude(
              floor.ceilingPolygons,
              0.012,
              floor.elevation + (floor.ceilingHeight || 2.5),
              ceilingMat,
            );
            ceiling.name = "interior-ceiling";
            g.add(ceiling);
          }
          g.add(
            createFacades(
              facadeData.elements,
              floor.level,
              brickMat,
              frameMat,
              reflections,
            ),
          );
          g.add(furnishings(floor));
          floorGroups.push(g);
          scene.add(g);
        }
        const roofGroup = new THREE.Group();
        const top = data.floors[2];
        if (top.roofPolygons?.length) {
          roofGroup.add(extrude(top.roofPolygons, 0.78, 8.0, frameMat));
          roofGroup.add(extrude(top.roofPolygons, 0.02, 8.78, roofMat));
        }
        scene.add(roofGroup);
        landscape(scene, bounds);
        const keys = new Set<string>();
        let yaw = 0,
          pitch = 0;
        const eye = 1.62;
        const floorNow = () =>
          data.floors.find((f) => f.level === state.current.level)!;
        const configure = () => {
          drawFrames = 3;
          renderer!.shadowMap.needsUpdate = true;
          const current = state.current;
          const floor = floorNow();
          floorGroups.forEach(
            (g) =>
              (g.visible =
                current.mode === "exterior" ||
                g.userData.level === current.level),
          );
          floorGroups.forEach((g) => {
            const ceiling = g.getObjectByName("interior-ceiling");
            if (ceiling) ceiling.visible = current.mode !== "overview";
            const cap = g.getObjectByName("exposed-roof");
            if (cap) cap.visible = current.mode !== "overview";
          });
          roofGroup.visible = current.mode === "exterior";
          controls!.enabled = current.mode !== "walk";
          keys.clear();
          if (current.mode === "exterior") {
            const fit = Math.max(1, 1.65 / camera.aspect);
            camera.position.set(cx + 16 * fit, 4 + 4.5 * fit, cz + 40 * fit);
            controls!.target.set(cx, 4, cz);
            camera.fov = 43;
          } else if (current.mode === "overview") {
            const fit = Math.max(1, 1.65 / camera.aspect);
            camera.position.set(
              cx + 16 * fit,
              floor.elevation + 25 * fit,
              cz + 20 * fit,
            );
            controls!.target.set(cx, floor.elevation, cz);
            camera.fov = 43;
          } else {
            const unit =
              floor.units.find((a) => a.id === current.apartment) ||
              floor.units[0];
            const spawn = new THREE.Vector3(
              unit.x,
              floor.elevation + eye,
              unit.z + 1.8,
            );
            const safe =
              !floor.wallPolygons.some((p) => inside(spawn, p)) &&
              floor.slabPolygons?.some((p) => inside(spawn, p));
            camera.position.set(
              unit.x,
              floor.elevation + eye,
              safe ? unit.z + 1.8 : unit.z,
            );
            yaw = 0;
            pitch = -0.06;
            camera.rotation.order = "YXZ";
            camera.rotation.set(pitch, yaw, 0);
            camera.fov = 68;
          }
          camera.updateProjectionMatrix();
          if (current.mode !== "walk") controls!.update();
          holder.dataset.cameraPosition = camera.position.toArray().join(",");
        };
        const move = (action: SceneCommand, delta = 0.32) => {
          drawFrames = 3;
          const current = state.current;
          if (action === "reset") {
            configure();
            return;
          }
          if (action === "zoomIn" || action === "zoomOut") {
            if (current.mode === "walk") {
              camera.fov = THREE.MathUtils.clamp(
                camera.fov + (action === "zoomIn" ? -5 : 5),
                35,
                90,
              );
              camera.updateProjectionMatrix();
              holder.dataset.fov = String(camera.fov);
            } else {
              const v = camera.position.clone().sub(controls!.target);
              v.multiplyScalar(action === "zoomIn" ? 0.86 : 1.16);
              camera.position.copy(controls!.target).add(v);
            }
            return;
          }
          if (current.mode !== "walk") return;
          const offset = new THREE.Vector3(
            action === "left" ? -delta : action === "right" ? delta : 0,
            0,
            action === "forward" ? -delta : action === "backward" ? delta : 0,
          ).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
          const next = camera.position.clone().add(offset);
          const floor = floorNow();
          const b = floor.bounds;
          const valid = (point: THREE.Vector3) =>
            point.x > b[0] - 0.5 &&
            point.x < b[2] + 0.5 &&
            point.z > b[1] - 0.5 &&
            point.z < b[3] + 0.5 &&
            !floor.wallPolygons.some((p) => inside(point, p)) &&
            !floor.facadePolygons.some((p) => inside(point, p)) &&
            (floor.level === 0 ||
              !floor.slabPolygons ||
              floor.slabPolygons.some((p) => inside(point, p)));
          if (
            valid(next) &&
            valid(next.clone().add(new THREE.Vector3(0.13, 0, 0))) &&
            valid(next.clone().add(new THREE.Vector3(-0.13, 0, 0))) &&
            valid(next.clone().add(new THREE.Vector3(0, 0, 0.13))) &&
            valid(next.clone().add(new THREE.Vector3(0, 0, -0.13)))
          ) {
            camera.position.copy(next);
            holder.dataset.cameraPosition = camera.position.toArray().join(",");
          }
        };
        api.current = { configure, command: move };
        configure();
        let pointer: { x: number; y: number } | null = null;
        const canvas = renderer.domElement;
        const down = (e: PointerEvent) => {
          if (state.current.mode === "walk") {
            pointer = { x: e.clientX, y: e.clientY };
            canvas.setPointerCapture(e.pointerId);
            canvas.focus();
          }
        };
        const drag = (e: PointerEvent) => {
          drawFrames = 3;
          if (pointer && state.current.mode === "walk") {
            yaw -= (e.clientX - pointer.x) * 0.004;
            pitch = THREE.MathUtils.clamp(
              pitch - (e.clientY - pointer.y) * 0.003,
              -1.2,
              1.2,
            );
            camera.rotation.set(pitch, yaw, 0, "YXZ");
            holder.dataset.cameraRotation = camera.rotation
              .toArray()
              .slice(0, 3)
              .join(",");
            pointer = { x: e.clientX, y: e.clientY };
          }
        };
        const up = () => {
          pointer = null;
        };
        const keydown = (e: KeyboardEvent) => {
          if (
            state.current.mode !== "walk" ||
            document.activeElement !== canvas
          )
            return;
          if (
            [
              "KeyW",
              "KeyA",
              "KeyS",
              "KeyD",
              "ArrowUp",
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
            ].includes(e.code)
          ) {
            e.preventDefault();
            keys.add(e.code);
          }
        };
        const keyup = (e: KeyboardEvent) => keys.delete(e.code);
        const blur = () => keys.clear();
        const wheel = (e: WheelEvent) => {
          if (state.current.mode === "walk") {
            e.preventDefault();
            move(e.deltaY < 0 ? "zoomIn" : "zoomOut");
          }
        };
        const loss = (e: Event) => {
          e.preventDefault();
          fail();
        };
        canvas.addEventListener("pointerdown", down);
        canvas.addEventListener("pointermove", drag);
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("wheel", wheel, { passive: false });
        canvas.addEventListener("webglcontextlost", loss);
        window.addEventListener("keydown", keydown);
        window.addEventListener("keyup", keyup);
        window.addEventListener("blur", blur);
        cleanupEvents.push(() => {
          canvas.removeEventListener("pointerdown", down);
          canvas.removeEventListener("pointermove", drag);
          canvas.removeEventListener("pointerup", up);
          canvas.removeEventListener("pointercancel", up);
          canvas.removeEventListener("wheel", wheel);
          canvas.removeEventListener("webglcontextlost", loss);
          window.removeEventListener("keydown", keydown);
          window.removeEventListener("keyup", keyup);
          window.removeEventListener("blur", blur);
        });
        resize = new ResizeObserver(() => {
          if (!renderer) return;
          const w = holder.clientWidth,
            h = holder.clientHeight;
          renderer.setSize(w, h);
          drawFrames = 3;

          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          if (state.current.mode !== "walk") configure();
        });
        resize.observe(holder);
        let prev = performance.now();
        function animate(now: number) {
          if (disposed || stopped) return;
          frame = requestAnimationFrame(animate);
          const dt = Math.min((now - prev) / 1000, 0.04);
          prev = now;
          if (document.hidden || !visible || state.current.paused) return;
          if (state.current.mode === "walk") {
            const stick = state.current.movement;
            if (Math.abs(stick.x) > 0.08)
              move(
                stick.x > 0 ? "right" : "left",
                Math.abs(stick.x) * dt * 2.3,
              );
            if (Math.abs(stick.y) > 0.08)
              move(
                stick.y > 0 ? "backward" : "forward",
                Math.abs(stick.y) * dt * 2.3,
              );
            for (const [codes, action] of [
              [["KeyW", "ArrowUp"], "forward"],
              [["KeyS", "ArrowDown"], "backward"],
              [["KeyA", "ArrowLeft"], "left"],
              [["KeyD", "ArrowRight"], "right"],
            ] as [string[], SceneCommand][]) {
              if (codes.some((k) => keys.has(k))) move(action, dt * 2.3);
            }
          } else controls!.update();
          if (drawFrames > 0) {
            renderer!.render(scene!, camera);
            drawFrames--;
            renderer!.shadowMap.autoUpdate = false;
          }
        }
        frame = requestAnimationFrame(animate);
        setStatus("ready");
      } catch (e) {
        if (!abort.signal.aborted) fail();
      }
    }
    init();
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      resize?.disconnect();
      visibility.disconnect();
      cleanupEvents.forEach((fn) => fn());
      controls?.dispose();
      scene?.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          mats.forEach((m) => {
            if (
              ![
                wallMat,
                brickMat,
                slabMat,
                floorMat,
                frameMat,
                fabricMat,
                woodMat,
              ].includes(m)
            ) {
              if (m instanceof THREE.MeshStandardMaterial) m.map?.dispose();
              m.dispose();
            }
          });
        }
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      api.current = null;
    };
  }, []);
  useEffect(() => api.current?.configure(), [mode, level, apartment]);
  useEffect(() => {
    if (command) api.current?.command(command.action);
  }, [command]);
  return (
    <div
      className={`scene-canvas ${hero ? "hero-scene" : ""}`}
      ref={container}
      data-scene-status={status}
      data-mode={mode}
      data-unit={apartment}
      data-level={level}
    >
      {status === "loading" && (
        <div className="scene-message" role="status">
          3D-omgeving wordt geladen…
        </div>
      )}
      {status === "error" && (
        <div className="scene-message">
          <p>3D is niet beschikbaar in deze browser.</p>
          <p>De architectuurplannen blijven hieronder beschikbaar.</p>
        </div>
      )}
    </div>
  );
}

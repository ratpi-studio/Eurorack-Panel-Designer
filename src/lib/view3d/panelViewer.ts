import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { PANEL_BODY_MATERIAL_INDEX, PANEL_RELIEF_MATERIAL_INDEX } from "@lib/exportStl";
import { DEFAULT_VIEW_DIRECTION, computeFitDistance, type Vector3Like } from "./cameraFit";

/** Rebuilds up to this long follow every edit; slower ones (SVG relief) wait for edits to pause. */
const LIVE_REBUILD_BUDGET_MS = 12;
/** Pause in edits before a slow rebuild runs, so dragging in 2D does not stutter. */
const PAUSED_REBUILD_DELAY_MS = 150;
const FIELD_OF_VIEW_DEG = 30;
const MAX_PIXEL_RATIO = 2;
const VIEW_DIRECTION = new Vector3(
  DEFAULT_VIEW_DIRECTION.x,
  DEFAULT_VIEW_DIRECTION.y,
  DEFAULT_VIEW_DIRECTION.z,
);

export interface PanelViewer {
  /** Swaps in a new model, built right away or once edits pause. `build` returns null on failure. */
  scheduleGeometry: (build: () => BufferGeometry | null) => void;
  setColors: (panelColor: string, designColor: string) => void;
  /** Panel slab size in mm, which the camera orbits around and frames. */
  setPanelSize: (size: Vector3Like) => void;
  /** Frames the whole panel, and keeps it framed on resize until the camera is moved by hand. */
  frame: () => void;
  dispose: () => void;
}

/** Renders a panel model on `canvas`, sized to the canvas box. Throws when WebGL is unavailable. */
export function createPanelViewer(canvas: HTMLCanvasElement): PanelViewer {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);

  // Diffuse materials and lights: the front face renders close to the 2D colors (glossy
  // reflections would gray out dark panels), while the walls of cut-outs and relief get shaded.
  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0x2b3040, 2));
  const keyLight = new DirectionalLight(0xffffff, 2);
  keyLight.position.set(-0.6, 0.9, 1);
  scene.add(keyLight);
  const fillLight = new DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(1, -0.3, 0.6);
  scene.add(fillLight);

  const bodyMaterial = new MeshLambertMaterial();
  const reliefMaterial = new MeshLambertMaterial();
  const materials: MeshLambertMaterial[] = [];
  materials[PANEL_BODY_MATERIAL_INDEX] = bodyMaterial;
  materials[PANEL_RELIEF_MATERIAL_INDEX] = reliefMaterial;
  const mesh = new Mesh(undefined, materials);
  scene.add(mesh);

  const camera = new PerspectiveCamera(FIELD_OF_VIEW_DEG, 1, 1, 20000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  let panelSize: Vector3Like = { x: 0, y: 0, z: 0 };
  let autoFrame = true;
  let disposed = false;
  let renderFrameId = 0;
  let buildFrameId = 0;
  let buildTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let pendingBuild: (() => BufferGeometry | null) | null = null;
  let lastBuildMs = 0;

  const render = () => {
    renderFrameId = 0;
    if (disposed) {
      return;
    }
    // update() reports camera moves, damping included, through "change", which asks for a frame.
    controls.update();
    renderer.render(scene, camera);
  };

  const requestRender = () => {
    if (!disposed && renderFrameId === 0) {
      renderFrameId = requestAnimationFrame(render);
    }
  };

  const renderNow = () => {
    cancelAnimationFrame(renderFrameId);
    render();
  };

  const getPanelCenter = () => new Vector3(panelSize.x / 2, panelSize.y / 2, panelSize.z / 2);

  const frame = () => {
    autoFrame = true;
    if (panelSize.x <= 0 || panelSize.y <= 0) {
      return;
    }
    // Without damping, update() drops the rotation still easing out instead of applying it later.
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;

    const distance = computeFitDistance({
      size: panelSize,
      direction: DEFAULT_VIEW_DIRECTION,
      verticalFovDeg: camera.fov,
      aspect: camera.aspect,
    });
    const center = getPanelCenter();
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance);
    controls.minDistance = Math.max(panelSize.x, panelSize.y) * 0.1;
    controls.maxDistance = distance * 6;
    controls.update();
    requestRender();
  };

  const setPanelSize = (size: Vector3Like) => {
    if (size.x === panelSize.x && size.y === panelSize.y && size.z === panelSize.z) {
      return;
    }
    const previousCenter = getPanelCenter();
    panelSize = { ...size };
    if (autoFrame) {
      frame();
      return;
    }
    // Keep the user's angle and distance, around the new center.
    const shift = getPanelCenter().sub(previousCenter);
    controls.target.add(shift);
    camera.position.add(shift);
    requestRender();
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) {
      return;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (autoFrame) {
      frame();
    }
    // Resizing clears the canvas: draw now rather than on the next frame to avoid a blank flash.
    renderNow();
  };

  const runPendingBuild = () => {
    buildFrameId = 0;
    buildTimeoutId = undefined;
    const build = pendingBuild;
    pendingBuild = null;
    if (!build || disposed) {
      return;
    }
    const startedAt = performance.now();
    const geometry = build();
    lastBuildMs = performance.now() - startedAt;
    if (!geometry) {
      return;
    }
    const previousGeometry = mesh.geometry;
    mesh.geometry = geometry;
    previousGeometry.dispose();
    renderNow();
  };

  const cancelPendingBuild = () => {
    cancelAnimationFrame(buildFrameId);
    buildFrameId = 0;
    clearTimeout(buildTimeoutId);
    buildTimeoutId = undefined;
  };

  const scheduleGeometry = (build: () => BufferGeometry | null) => {
    pendingBuild = build;
    cancelPendingBuild();
    if (lastBuildMs <= LIVE_REBUILD_BUDGET_MS) {
      buildFrameId = requestAnimationFrame(runPendingBuild);
    } else {
      buildTimeoutId = setTimeout(runPendingBuild, PAUSED_REBUILD_DELAY_MS);
    }
  };

  const setColors = (panelColor: string, designColor: string) => {
    bodyMaterial.color.set(panelColor);
    reliefMaterial.color.set(designColor);
    requestRender();
  };

  const stopAutoFrame = () => {
    autoFrame = false;
  };

  controls.addEventListener("start", stopAutoFrame);
  controls.addEventListener("change", requestRender);
  canvas.addEventListener("webglcontextrestored", requestRender);
  const resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) {
      resize(entry.contentRect.width, entry.contentRect.height);
    }
  });
  resizeObserver.observe(canvas);
  resize(canvas.clientWidth, canvas.clientHeight);

  const dispose = () => {
    disposed = true;
    pendingBuild = null;
    cancelPendingBuild();
    cancelAnimationFrame(renderFrameId);
    resizeObserver.disconnect();
    canvas.removeEventListener("webglcontextrestored", requestRender);
    controls.removeEventListener("start", stopAutoFrame);
    controls.removeEventListener("change", requestRender);
    controls.dispose();
    mesh.geometry.dispose();
    bodyMaterial.dispose();
    reliefMaterial.dispose();
    renderer.dispose();
  };

  return { scheduleGeometry, setColors, setPanelSize, frame, dispose };
}

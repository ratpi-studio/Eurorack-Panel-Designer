import React from 'react';
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { createPanelExtrusion } from '@lib/exportStl';
import { type MountingHole, type PanelModel } from '@lib/panelTypes';

import * as styles from './StlPreview.css';

interface StlPreviewProps {
  model: PanelModel;
  mountingHoles: MountingHole[];
  thicknessMm: number;
}

export function StlPreview({ model, mountingHoles, thicknessMm }: StlPreviewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return;
    }

    if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) {
      return;
    }

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new Scene();
    scene.background = new Color('#0b1226');

    const geometry = createPanelExtrusion(model, mountingHoles, thicknessMm);
    const material = new MeshStandardMaterial({
      color: 0x5eead4,
      metalness: 0.15,
      roughness: 0.35
    });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    const box = new Box3().setFromObject(mesh);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    mesh.position.set(-center.x, -center.y, -center.z);
    box.setFromObject(mesh);
    box.getSize(size);
    box.getCenter(center);

    const initialWidth = container.clientWidth || 320;
    const initialHeight = container.clientHeight || 240;
    renderer.setSize(initialWidth, initialHeight, false);

    const camera = new PerspectiveCamera(
      35,
      initialWidth / initialHeight,
      0.1,
      2000
    );
    const maxSize = Math.max(size.x, size.y, size.z);
    const distance = maxSize * 2.4 + thicknessMm;
    camera.position.set(center.x + distance, center.y + distance * 0.4, center.z + distance);
    camera.lookAt(center);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.update();

    const ambient = new AmbientLight(0xffffff, 0.55);
    const directional = new DirectionalLight(0xffffff, 0.7);
    directional.position.set(1, 1.2, 1.5);
    scene.add(ambient);
    scene.add(directional);

    let frameId = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    render();

    const handleResize = () => {
      const width = container.clientWidth || initialWidth;
      const height = container.clientHeight || initialHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [model, mountingHoles, thicknessMm]);

  return (
    <div ref={containerRef} className={styles.root}>
      <canvas ref={canvasRef} className={styles.canvas} aria-label="STL preview" />
    </div>
  );
}

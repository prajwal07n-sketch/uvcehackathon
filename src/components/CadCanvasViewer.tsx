'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Layers, Box, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface CadCanvasViewerProps {
  meshUrl?: string;
  title?: string;
  initialColor?: string;
  autoRotate?: boolean;
  height?: string;
}

// Lightweight STL Parser (supports ASCII and Binary STL format)
function parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry {
  const isBinary = (buf: ArrayBuffer): boolean => {
    if (buf.byteLength < 84) return false;
    const reader = new DataView(buf);
    const expectedTris = reader.getUint32(80, true);
    // In binary STL: total size = 80 bytes header + 4 bytes tri count + (50 * expectedTris)
    return 84 + expectedTris * 50 === buf.byteLength;
  };

  const geometry = new THREE.BufferGeometry();

  if (isBinary(buffer)) {
    const reader = new DataView(buffer);
    const faces = reader.getUint32(80, true);
    const dataOffset = 84;
    const faceLength = 12 * 4 + 2;

    const vertices = new Float32Array(faces * 3 * 3);
    const normals = new Float32Array(faces * 3 * 3);

    for (let face = 0; face < faces; face++) {
      const start = dataOffset + face * faceLength;
      const nx = reader.getFloat32(start, true);
      const ny = reader.getFloat32(start + 4, true);
      const nz = reader.getFloat32(start + 8, true);

      for (let i = 1; i <= 3; i++) {
        const vertexstart = start + i * 12;
        const vIndex = face * 9 + (i - 1) * 3;
        vertices[vIndex] = reader.getFloat32(vertexstart, true);
        vertices[vIndex + 1] = reader.getFloat32(vertexstart + 4, true);
        vertices[vIndex + 2] = reader.getFloat32(vertexstart + 8, true);

        normals[vIndex] = nx;
        normals[vIndex + 1] = ny;
        normals[vIndex + 2] = nz;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  } else {
    // Parse ASCII STL
    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text.split('\n');
    const vertices: number[] = [];
    const normals: number[] = [];

    let currentNormal = [0, 0, 1];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('facet normal')) {
        const parts = line.split(/\s+/);
        currentNormal = [
          parseFloat(parts[2]) || 0,
          parseFloat(parts[3]) || 0,
          parseFloat(parts[4]) || 1,
        ];
      } else if (line.startsWith('vertex')) {
        const parts = line.split(/\s+/);
        vertices.push(
          parseFloat(parts[1]) || 0,
          parseFloat(parts[2]) || 0,
          parseFloat(parts[3]) || 0
        );
        normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    if (normals.length === vertices.length) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    } else {
      geometry.computeVertexNormals();
    }
  }

  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export default function CadCanvasViewer({
  meshUrl,
  title = 'CAD Component',
  initialColor = '#2563eb', // Blueprint blue
  autoRotate = true,
  height = '420px',
}: CadCanvasViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [rotating, setRotating] = useState(autoRotate);
  const [meshColor, setMeshColor] = useState(initialColor);
  const [dimensions, setDimensions] = useState<{ x: number; y: number; z: number } | null>(null);
  const [faceCount, setFaceCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b1120); // Dark engineering slate

    // 2. Camera setup
    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.set(60, 60, 80);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Engineering Grid and Floor
    const grid = new THREE.GridHelper(120, 24, 0x1e3a8a, 0x1e293b);
    grid.position.y = -20;
    scene.add(grid);

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(60, 100, 60);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6); // Cyan rim light
    dirLight2.position.set(-60, -30, -50);
    scene.add(dirLight2);

    // 6. Fetch & Load STL Geometry
    setLoading(true);
    setError(null);

    const targetUrl = meshUrl || '/cad-models/cycloidal-gearbox.stl';

    fetch(targetUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const geometry = parseSTL(buffer);

        // Compute Bounding Box
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const sizeX = +(bbox.max.x - bbox.min.x).toFixed(1);
        const sizeY = +(bbox.max.y - bbox.min.y).toFixed(1);
        const sizeZ = +(bbox.max.z - bbox.min.z).toFixed(1);
        setDimensions({ x: sizeX, y: sizeY, z: sizeZ });

        const posAttr = geometry.getAttribute('position');
        setFaceCount(posAttr ? Math.round(posAttr.count / 3) : 0);

        // Adjust camera to fit geometry nicely
        const maxDim = Math.max(sizeX, sizeY, sizeZ);
        camera.position.set(maxDim * 1.6, maxDim * 1.4, maxDim * 1.8);
        camera.lookAt(0, 0, 0);

        // Create Mesh with Technical Material
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(meshColor),
          metalness: 0.35,
          roughness: 0.45,
          flatShading: true,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshRef.current = mesh;

        // Wireframe Overlay
        const wireGeometry = new THREE.WireframeGeometry(geometry);
        const wireMaterial = new THREE.LineBasicMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.25,
        });
        const wireframeMesh = new THREE.LineSegments(wireGeometry, wireMaterial);
        wireframeMesh.visible = wireframe;
        scene.add(wireframeMesh);
        wireframeMeshRef.current = wireframeMesh;

        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load primary STL, generating fallback demo geometry:', err);
        // Fallback procedural engineering gear geometry
        const fallbackGeom = new THREE.TorusKnotGeometry(18, 5, 100, 16);
        fallbackGeom.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(meshColor),
          metalness: 0.4,
          roughness: 0.4,
        });
        const mesh = new THREE.Mesh(fallbackGeom, material);
        scene.add(mesh);
        meshRef.current = mesh;
        setDimensions({ x: 42, y: 42, z: 24 });
        setFaceCount(1600);
        setLoading(false);
      });

    // 7. Interaction Event Handlers (Mouse drag Orbit & Zoom)
    const dom = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !meshRef.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;

      meshRef.current.rotation.y += deltaX * 0.01;
      meshRef.current.rotation.x += deltaY * 0.01;

      if (wireframeMeshRef.current) {
        wireframeMeshRef.current.rotation.y = meshRef.current.rotation.y;
        wireframeMeshRef.current.rotation.x = meshRef.current.rotation.x;
      }

      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const factor = e.deltaY * 0.05;
      cameraRef.current.position.multiplyScalar(1 + factor * 0.02);
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (rotating && meshRef.current && !isDraggingRef.current) {
        meshRef.current.rotation.y += 0.008;
        if (wireframeMeshRef.current) {
          wireframeMeshRef.current.rotation.y = meshRef.current.rotation.y;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      resizeObserver.disconnect();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meshUrl]);

  // Sync color changes
  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).color.set(meshColor);
    }
  }, [meshColor]);

  // Sync wireframe visibility
  useEffect(() => {
    if (wireframeMeshRef.current) {
      wireframeMeshRef.current.visible = wireframe;
    }
  }, [wireframe]);

  const handleResetCamera = () => {
    if (cameraRef.current && meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
      if (wireframeMeshRef.current) wireframeMeshRef.current.rotation.set(0, 0, 0);
      cameraRef.current.position.set(60, 60, 80);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.85 : 1.15;
    cameraRef.current.position.multiplyScalar(factor);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex flex-col">
      {/* CAD Viewer Header Toolbar */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-sky-400" />
          <span className="text-xs font-mono font-semibold tracking-wide text-slate-200 uppercase truncate max-w-[200px] sm:max-w-xs">
            {title}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-sky-950 text-sky-400 rounded border border-sky-800">
            3D MESH VIEWER
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRotating(!rotating)}
            title={rotating ? 'Pause Auto-Rotation' : 'Start Auto-Rotation'}
            className={`p-1.5 rounded-lg border text-xs transition ${
              rotating
                ? 'bg-sky-600/30 border-sky-500 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Mesh"
            className={`p-1.5 rounded-lg border text-xs transition ${
              wireframe
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom('in')}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom('out')}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset Perspective"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        style={{ height }}
        className="w-full relative cursor-grab active:cursor-grabbing select-none"
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-mono text-sky-400">Loading CAD Geometry & Bounding Box...</p>
          </div>
        )}
      </div>

      {/* Bottom Technical Inspector Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          {dimensions && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500">BBOX:</span>
              <span className="text-slate-200">
                {dimensions.x} × {dimensions.y} × {dimensions.z} mm
              </span>
            </span>
          )}
          {faceCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500">FACETS:</span>
              <span className="text-emerald-400">{faceCount.toLocaleString()}</span>
            </span>
          )}
        </div>

        {/* Material Color Presets */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 hidden sm:inline">CAD Shade:</span>
          <div className="flex items-center gap-1.5">
            {[
              { name: 'Blueprint Blue', color: '#2563eb' },
              { name: 'Carbon Fiber Slate', color: '#334155' },
              { name: 'PLA Orange', color: '#ea580c' },
              { name: 'Bio-Emerald', color: '#059669' },
              { name: 'Alloy White', color: '#e2e8f0' },
            ].map((preset) => (
              <button
                key={preset.color}
                onClick={() => setMeshColor(preset.color)}
                title={preset.name}
                style={{ backgroundColor: preset.color }}
                className={`w-3.5 h-3.5 rounded-full border transition transform hover:scale-125 ${
                  meshColor === preset.color ? 'ring-2 ring-sky-400 border-white' : 'border-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

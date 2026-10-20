import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'cad-models');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function writeStl(filename, solidName, triangles) {
  let content = `solid ${solidName}\n`;
  for (const tri of triangles) {
    const [p1, p2, p3] = tri;
    // Calculate normal
    const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ];
    const len = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    const nx = (n[0] / len).toFixed(4);
    const ny = (n[1] / len).toFixed(4);
    const nz = (n[2] / len).toFixed(4);

    content += `  facet normal ${nx} ${ny} ${nz}\n`;
    content += `    outer loop\n`;
    content += `      vertex ${p1[0].toFixed(3)} ${p1[1].toFixed(3)} ${p1[2].toFixed(3)}\n`;
    content += `      vertex ${p2[0].toFixed(3)} ${p2[1].toFixed(3)} ${p2[2].toFixed(3)}\n`;
    content += `      vertex ${p3[0].toFixed(3)} ${p3[1].toFixed(3)} ${p3[2].toFixed(3)}\n`;
    content += `    endloop\n`;
    content += `  endfacet\n`;
  }
  content += `endsolid ${solidName}\n`;
  fs.writeFileSync(path.join(outDir, filename), content, 'utf8');
  console.log(`Generated STL: ${filename} with ${triangles.length} facets`);
}

// 1. Cycloidal Gear Disk (10 lobes, R_base=30, amp=4, height=8)
function generateCycloidalGear() {
  const lobes = 10;
  const segments = 120;
  const height = 8;
  const rBase = 28;
  const rAmp = 4;
  const rInner = 8;

  const outerProfile = [];
  const innerProfile = [];

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const r = rBase + rAmp * Math.cos(lobes * theta);
    outerProfile.push([r * Math.cos(theta), r * Math.sin(theta)]);
    innerProfile.push([rInner * Math.cos(theta), rInner * Math.sin(theta)]);
  }

  const triangles = [];
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const pOuter1 = outerProfile[i];
    const pOuter2 = outerProfile[next];
    const pInner1 = innerProfile[i];
    const pInner2 = innerProfile[next];

    // Top face (z = height)
    triangles.push([
      [pOuter1[0], pOuter1[1], height],
      [pOuter2[0], pOuter2[1], height],
      [pInner1[0], pInner1[1], height]
    ]);
    triangles.push([
      [pOuter2[0], pOuter2[1], height],
      [pInner2[0], pInner2[1], height],
      [pInner1[0], pInner1[1], height]
    ]);

    // Bottom face (z = 0)
    triangles.push([
      [pOuter1[0], pOuter1[1], 0],
      [pInner1[0], pInner1[1], 0],
      [pOuter2[0], pOuter2[1], 0]
    ]);
    triangles.push([
      [pOuter2[0], pOuter2[1], 0],
      [pInner1[0], pInner1[1], 0],
      [pInner2[0], pInner2[1], 0]
    ]);

    // Outer wall
    triangles.push([
      [pOuter1[0], pOuter1[1], 0],
      [pOuter2[0], pOuter2[1], 0],
      [pOuter1[0], pOuter1[1], height]
    ]);
    triangles.push([
      [pOuter2[0], pOuter2[1], 0],
      [pOuter2[0], pOuter2[1], height],
      [pOuter1[0], pOuter1[1], height]
    ]);

    // Inner bore wall
    triangles.push([
      [pInner1[0], pInner1[1], 0],
      [pInner1[0], pInner1[1], height],
      [pInner2[0], pInner2[1], 0]
    ]);
    triangles.push([
      [pInner2[0], pInner2[1], 0],
      [pInner1[0], pInner1[1], height],
      [pInner2[0], pInner2[1], height]
    ]);
  }

  return triangles;
}

// 2. Axial Flux Stator Ring (12 slotted teeth)
function generateAxialFluxStator() {
  const teeth = 12;
  const segments = teeth * 6;
  const height = 12;
  const rOuter = 40;
  const rInner = 22;
  const toothDepth = 6;

  const profile = [];
  for (let i = 0; i < teeth; i++) {
    const baseAngle = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    const a0 = baseAngle;
    const a1 = baseAngle + step * 0.35;
    const a2 = baseAngle + step * 0.45;
    const a3 = baseAngle + step * 0.85;
    const a4 = baseAngle + step * 0.95;

    profile.push([rOuter * Math.cos(a0), rOuter * Math.sin(a0)]);
    profile.push([(rOuter - toothDepth) * Math.cos(a1), (rOuter - toothDepth) * Math.sin(a1)]);
    profile.push([(rOuter - toothDepth) * Math.cos(a2), (rOuter - toothDepth) * Math.sin(a2)]);
    profile.push([rOuter * Math.cos(a3), rOuter * Math.sin(a3)]);
    profile.push([rOuter * Math.cos(a4), rOuter * Math.sin(a4)]);
  }

  const innerProfile = [];
  for (let i = 0; i < profile.length; i++) {
    const theta = (i / profile.length) * Math.PI * 2;
    innerProfile.push([rInner * Math.cos(theta), rInner * Math.sin(theta)]);
  }

  const triangles = [];
  const n = profile.length;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const pO1 = profile[i];
    const pO2 = profile[next];
    const pI1 = innerProfile[i];
    const pI2 = innerProfile[next];

    // Top
    triangles.push([[pO1[0], pO1[1], height], [pO2[0], pO2[1], height], [pI1[0], pI1[1], height]]);
    triangles.push([[pO2[0], pO2[1], height], [pI2[0], pI2[1], height], [pI1[0], pI1[1], height]]);

    // Bottom
    triangles.push([[pO1[0], pO1[1], 0], [pI1[0], pI1[1], 0], [pO2[0], pO2[1], 0]]);
    triangles.push([[pO2[0], pO2[1], 0], [pI1[0], pI1[1], 0], [pI2[0], pI2[1], 0]]);

    // Outer wall
    triangles.push([[pO1[0], pO1[1], 0], [pO2[0], pO2[1], 0], [pO1[0], pO1[1], height]]);
    triangles.push([[pO2[0], pO2[1], 0], [pO2[0], pO2[1], height], [pO1[0], pO1[1], height]]);

    // Inner wall
    triangles.push([[pI1[0], pI1[1], 0], [pI1[0], pI1[1], height], [pI2[0], pI2[1], 0]]);
    triangles.push([[pI2[0], pI2[1], 0], [pI1[0], pI1[1], height], [pI2[0], pI2[1], height]]);
  }

  return triangles;
}

// 3. Sensor Enclosure Case
function generateEnclosureBox() {
  const w = 45, d = 30, h = 18, t = 2.5;
  const triangles = [];

  function addQuad(p1, p2, p3, p4) {
    triangles.push([p1, p2, p3]);
    triangles.push([p1, p3, p4]);
  }

  // Outer Box (bottom open or solid bottom, top open cavity)
  // Bottom plate
  addQuad([-w/2, -d/2, 0], [w/2, -d/2, 0], [w/2, d/2, 0], [-w/2, d/2, 0]);

  // Outer 4 walls
  addQuad([-w/2, -d/2, 0], [-w/2, d/2, 0], [-w/2, d/2, h], [-w/2, -d/2, h]);
  addQuad([w/2, -d/2, 0], [w/2, -d/2, h], [w/2, d/2, h], [w/2, d/2, 0]);
  addQuad([-w/2, -d/2, 0], [w/2, -d/2, 0], [w/2, -d/2, h], [-w/2, -d/2, h]);
  addQuad([-w/2, d/2, 0], [-w/2, d/2, h], [w/2, d/2, h], [w/2, d/2, 0]);

  // Inner cavity (offset by wall thickness t)
  const iw = w/2 - t, id = d/2 - t;
  // Floor of inner cavity
  addQuad([-iw, -id, t], [-iw, id, t], [iw, id, t], [iw, -id, t]);

  // Inner 4 walls
  addQuad([-iw, -id, t], [-iw, -id, h], [-iw, id, h], [-iw, id, t]);
  addQuad([iw, -id, t], [iw, id, t], [iw, id, h], [iw, -id, h]);
  addQuad([-iw, -id, t], [iw, -id, t], [iw, -id, h], [-iw, -id, h]);
  addQuad([-iw, id, t], [-iw, id, h], [iw, id, h], [iw, id, t]);

  // Top lip borders
  addQuad([-w/2, -d/2, h], [w/2, -d/2, h], [iw, -id, h], [-iw, -id, h]);
  addQuad([-w/2, d/2, h], [-iw, id, h], [iw, id, h], [w/2, d/2, h]);
  addQuad([-w/2, -d/2, h], [-iw, -id, h], [-iw, id, h], [-w/2, d/2, h]);
  addQuad([w/2, -d/2, h], [w/2, d/2, h], [iw, id, h], [iw, -id, h]);

  return triangles;
}

// 4. Drone Gimbal Arm Linkage
function generateGimbalLinkage() {
  const triangles = [];
  function addBox(cx, cy, cz, sx, sy, sz) {
    const x0 = cx - sx/2, x1 = cx + sx/2;
    const y0 = cy - sy/2, y1 = cy + sy/2;
    const z0 = cz - sz/2, z1 = cz + sz/2;

    function quad(p1, p2, p3, p4) {
      triangles.push([p1, p2, p3]);
      triangles.push([p1, p3, p4]);
    }
    // Bottom & Top
    quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
    quad([x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1]);
    // Front & Back
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
    // Left & Right
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
  }

  // Base motor bracket
  addBox(0, 0, 3, 24, 24, 6);
  // Vertical riser arm
  addBox(10, 0, 18, 6, 12, 24);
  // Horizontal pivot bar
  addBox(0, 0, 30, 26, 12, 6);
  // Camera mount flange
  addBox(-10, 0, 35, 8, 18, 4);

  return triangles;
}

writeStl('cycloidal-gearbox.stl', 'cycloidal_gear_disk', generateCycloidalGear());
writeStl('axial-flux-stator.stl', 'axial_flux_stator_core', generateAxialFluxStator());
writeStl('esp32-sensor-enclosure.stl', 'sensor_enclosure_case', generateEnclosureBox());
writeStl('drone-gimbal-linkage.stl', 'drone_gimbal_arm', generateGimbalLinkage());

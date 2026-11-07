import * as THREE from 'three';

export interface ArenaObstacle {
  mesh: THREE.Object3D;
  box: THREE.Box3;
  type: 'cover' | 'crate' | 'explosive_barrel' | 'pillar';
  hp?: number;
}

export interface ExplosiveBarrel {
  mesh: THREE.Mesh;
  box: THREE.Box3;
  hp: number;
  exploded: boolean;
}

export function buildZeroFrontArena(scene: THREE.Scene, environmentType: string = 'industrial'): {
  obstacles: ArenaObstacle[];
  explosiveBarrels: ExplosiveBarrel[];
  ringObject: THREE.Group;
  rainParticles: THREE.Points;
} {
  const obstacles: ArenaObstacle[] = [];
  const explosiveBarrels: ExplosiveBarrel[] = [];

  // 1. Generate Environment-Specific Ground Texture & Canvas
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = 1024;
  groundCanvas.height = 1024;
  const ctx = groundCanvas.getContext('2d')!;

  let primaryColor = 0x222a36;
  let accentNeonColor = 0x00f0ff;
  let crateColor = 0x1b2838;
  let barrelColor = 0xd90429;
  let particleColor = 0x00d2ff;
  let particleSize = 0.12;

  switch (environmentType) {
    case 'lab':
      ctx.fillStyle = '#0a1626';
      ctx.fillRect(0, 0, 1024, 1024);
      // Clean hexagonal / circuit grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 1024; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('AURORA ADVANCED RESEARCH // LAB 04', 200, 480);
      primaryColor = 0x1e3046;
      accentNeonColor = 0x38bdf8;
      crateColor = 0x162638;
      barrelColor = 0x0284c7;
      particleColor = 0x38bdf8;
      break;

    case 'city':
      ctx.fillStyle = '#080a14';
      ctx.fillRect(0, 0, 1024, 1024);
      // City asphalt with road markings & crosswalks
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= 1024; i += 128) {
        ctx.strokeRect(i, 0, 128, 1024);
      }
      // Magenta zebra stripes
      ctx.fillStyle = '#c026d3';
      for (let x = 200; x < 600; x += 50) {
        ctx.fillRect(x, 480, 25, 60);
      }
      ctx.fillStyle = 'rgba(232, 121, 249, 0.5)';
      ctx.font = 'bold 34px monospace';
      ctx.fillText('METRO QUARANTINE // SECTOR 03', 220, 440);
      primaryColor = 0x1f1d2e;
      accentNeonColor = 0xe879f9;
      crateColor = 0x181424;
      barrelColor = 0xef4444;
      particleColor = 0xa855f7;
      break;

    case 'orbital':
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, 1024, 1024);
      // Steel mesh grating pattern with hazard yellow
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 1024; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();
      }
      ctx.fillStyle = '#f59e0b';
      for (let x = 260; x < 580; x += 40) {
        ctx.fillRect(x, 490, 20, 40);
      }
      ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('SKYLINE CITADEL // ORBITAL DOCK 09', 180, 450);
      primaryColor = 0x1f2937;
      accentNeonColor = 0xf59e0b;
      crateColor = 0x111827;
      barrelColor = 0xd97706;
      particleColor = 0xffffff;
      particleSize = 0.08;
      break;

    case 'reactor':
      ctx.fillStyle = '#140608';
      ctx.fillRect(0, 0, 1024, 1024);
      // Molten orange heat grid
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= 1024; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(251, 146, 60, 0.7)';
      ctx.font = 'bold 34px monospace';
      ctx.fillText('TOKAMAK CORE // PLASMA STAGE 5', 200, 460);
      primaryColor = 0x2b1013;
      accentNeonColor = 0xf97316;
      crateColor = 0x1f0a0d;
      barrelColor = 0xe11d48;
      particleColor = 0xfb923c;
      particleSize = 0.16;
      break;

    case 'mech_factory':
      ctx.fillStyle = '#0f1117';
      ctx.fillRect(0, 0, 1024, 1024);
      // Heavy diamond tread pattern with black/yellow chevron stripes
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 1024; i += 48) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 1024, 1024);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - 1024, 1024);
        ctx.stroke();
      }
      ctx.fillStyle = '#eab308';
      for (let x = 240; x < 600; x += 40) {
        ctx.fillRect(x, 480, 20, 50);
      }
      ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('TITAN MECH FOUNDRY // BAY 07', 220, 440);
      primaryColor = 0x1f232b;
      accentNeonColor = 0xeab308;
      crateColor = 0x141820;
      barrelColor = 0xd97706;
      particleColor = 0xfde047;
      particleSize = 0.14;
      break;

    case 'core':
      ctx.fillStyle = '#03121f';
      ctx.fillRect(0, 0, 1024, 1024);
      // Cybernetic cyan matrix
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= 1024; i += 64) {
        ctx.strokeRect(i, 0, 64, 1024);
      }
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('APEX ZERO REACTOR // RUNTIME SYNC', 180, 460);
      primaryColor = 0x0f2b3d;
      accentNeonColor = 0x00f0ff;
      crateColor = 0x081f2d;
      barrelColor = 0x0284c7;
      particleColor = 0x00f0ff;
      particleSize = 0.15;
      break;

    case 'abyss':
      ctx.fillStyle = '#090114';
      ctx.fillRect(0, 0, 1024, 1024);
      // Fractured dimensional fissures with violet & crimson glow
      ctx.strokeStyle = 'rgba(192, 38, 211, 0.4)';
      ctx.lineWidth = 4;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 1024, 0);
        ctx.lineTo(Math.random() * 1024, 512);
        ctx.lineTo(Math.random() * 1024, 1024);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(217, 70, 239, 0.7)';
      ctx.font = 'bold 34px monospace';
      ctx.fillText('SINGULARITY HORIZON // ANOMALY ZERO', 160, 460);
      primaryColor = 0x1c0b2c;
      accentNeonColor = 0xd946ef;
      crateColor = 0x13061f;
      barrelColor = 0xa21caf;
      particleColor = 0xd946ef;
      particleSize = 0.18;
      break;

    case 'choice':
      ctx.fillStyle = '#07131e';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 1024; i += 64) {
        ctx.strokeRect(i, 0, 64, 1024);
      }
      ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.font = 'bold 34px monospace';
      ctx.fillText('ZERO SUMMIT // SANCTUARY DECK', 200, 460);
      primaryColor = 0x16293d;
      accentNeonColor = 0x38bdf8;
      crateColor = 0x0f1f30;
      barrelColor = 0x38bdf8;
      particleColor = 0xbae6fd;
      particleSize = 0.1;
      break;

    case 'industrial':
    default:
      ctx.fillStyle = '#0c121d';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.12)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 1024; i += 64) {
        ctx.strokeRect(i, 0, 64, 1024);
      }
      ctx.fillStyle = '#d97706';
      for (let x = 300; x < 500; x += 40) {
        ctx.fillRect(x, 480, 20, 50);
      }
      ctx.fillStyle = 'rgba(0, 210, 255, 0.4)';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('SECTOR 07 // ZERO FRONT', 280, 460);
      primaryColor = 0x222a36;
      accentNeonColor = 0x00f0ff;
      crateColor = 0x1b2838;
      barrelColor = 0xd90429;
      particleColor = 0x00d2ff;
      break;
  }

  // Create Ground Mesh (lean vertex count for peak 60+ FPS)
  const groundGeom = new THREE.PlaneGeometry(160, 160, 2, 2);
  const groundTexture = new THREE.CanvasTexture(groundCanvas);
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(8, 8);
  groundTexture.colorSpace = THREE.SRGBColorSpace;

  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: environmentType === 'lab' || environmentType === 'orbital' ? 0.2 : 0.4,
    metalness: environmentType === 'mech_factory' || environmentType === 'orbital' ? 0.7 : 0.4,
  });

  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Materials for obstacles
  const concreteMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.75,
    metalness: 0.3,
  });

  const crateDarkMat = new THREE.MeshStandardMaterial({
    color: crateColor,
    roughness: 0.4,
    metalness: 0.7,
  });

  const neonAccentMat = new THREE.MeshBasicMaterial({
    color: accentNeonColor,
  });

  const barrelMat = new THREE.MeshStandardMaterial({
    color: barrelColor,
    roughness: 0.35,
    metalness: 0.65,
  });

  // Helper to add barrier/cover box
  const addCover = (x: number, z: number, w: number, h: number, d: number, rotY = 0) => {
    const group = new THREE.Group();
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, concreteMat);
    mesh.position.y = h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Glowing rim on top edge
    const rimGeom = new THREE.BoxGeometry(w * 0.98, 0.05, 0.05);
    const rimMesh = new THREE.Mesh(rimGeom, neonAccentMat);
    rimMesh.position.set(0, h + 0.02, d / 2 - 0.04);
    group.add(rimMesh);

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    scene.add(group);

    const box = new THREE.Box3().setFromObject(group);
    obstacles.push({ mesh: group, box, type: 'cover' });
  };

  // Helper to add military cargo crate
  const addCargoCrate = (x: number, z: number, size = 2.4, rotY = 0) => {
    const group = new THREE.Group();
    const mainGeom = new THREE.BoxGeometry(size, size, size);
    const mainMesh = new THREE.Mesh(mainGeom, crateDarkMat);
    mainMesh.position.y = size / 2;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    group.add(mainMesh);

    // Glowing accent stripe frame
    const frameGeom = new THREE.BoxGeometry(size * 1.02, size * 0.12, size * 1.02);
    const frameMesh = new THREE.Mesh(frameGeom, neonAccentMat);
    frameMesh.position.y = size / 2;
    group.add(frameMesh);

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    scene.add(group);

    const box = new THREE.Box3().setFromObject(group);
    obstacles.push({ mesh: group, box, type: 'crate' });
  };

  // Helper to add explosive barrel
  const addExplosiveBarrel = (x: number, z: number) => {
    const geom = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
    const mesh = new THREE.Mesh(geom, barrelMat);
    mesh.position.set(x, 0.7, z);
    mesh.castShadow = true;
    scene.add(mesh);

    // Hazard symbol band
    const bandGeom = new THREE.CylinderGeometry(0.51, 0.51, 0.25, 16);
    const bandMesh = new THREE.Mesh(bandGeom, neonAccentMat);
    bandMesh.position.set(0, 0, 0);
    mesh.add(bandMesh);

    const box = new THREE.Box3().setFromObject(mesh);
    const barrelData = { mesh, box, hp: 25, exploded: false };
    explosiveBarrels.push(barrelData);
    obstacles.push({ mesh, box, type: 'explosive_barrel', hp: 25 });
  };

  // Spawn Tactical Covers across arena
  addCover(-5, -8, 4.5, 1.3, 0.8, 0.15);
  addCover(6, -10, 4.2, 1.3, 0.8, -0.2);
  addCover(-8, -20, 5.0, 1.4, 0.8, 0.3);
  addCover(7, -22, 5.0, 1.4, 0.8, -0.25);

  // Cargo crate clusters
  addCargoCrate(-12, -6, 2.4, 0.2);
  addCargoCrate(-12, -8.5, 2.4, 0.2);
  addCargoCrate(14, -7, 2.5, -0.3);
  addCargoCrate(13.5, -9.5, 2.5, -0.1);

  addCargoCrate(-15, -18, 2.8, 0.4);
  addCargoCrate(16, -19, 2.8, -0.4);

  // Explosive barrels near covers for tactical detonating
  addExplosiveBarrel(-10.5, -5.5);
  addExplosiveBarrel(12, -6);
  addExplosiveBarrel(-6, -18.5);
  addExplosiveBarrel(9, -20.5);
  addExplosiveBarrel(0, -28);

  // Distant Background Sci-Fi Structures
  const skylineGroup = new THREE.Group();
  const buildingGeoms = [
    new THREE.BoxGeometry(10, 50, 10),
    new THREE.BoxGeometry(14, 75, 14),
    new THREE.BoxGeometry(8, 60, 8),
    new THREE.BoxGeometry(16, 90, 16),
  ];

  const buildingMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.7,
    metalness: 0.6,
  });

  const windowMat = new THREE.MeshBasicMaterial({
    color: accentNeonColor,
  });

  for (let angle = 0; angle < Math.PI * 2; angle += 0.32) {
    const dist = 55 + Math.random() * 25;
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * dist;
    const geomIdx = Math.floor(Math.random() * buildingGeoms.length);
    const bMesh = new THREE.Mesh(buildingGeoms[geomIdx], buildingMat);
    bMesh.position.set(bx, 25 + Math.random() * 20, bz);
    skylineGroup.add(bMesh);

    // Glowing window strips
    if (Math.random() > 0.35) {
      const wGeom = new THREE.BoxGeometry(2, 15, 0.1);
      const wMesh = new THREE.Mesh(wGeom, windowMat);
      wMesh.position.set(bx, 30 + Math.random() * 20, bz > 0 ? bz - 5.1 : bz + 5.1);
      skylineGroup.add(wMesh);
    }
  }
  scene.add(skylineGroup);

  // Iconic Central Sci-Fi Structure (Torus / Anomaly Ring)
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0, 55, -80);
  ringGroup.rotation.x = 0.45;
  ringGroup.rotation.y = -0.3;

  // Outer primary ring
  const outerTorusGeom = new THREE.TorusGeometry(32, 1.2, 16, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.3,
    metalness: 0.9,
  });
  const outerRing = new THREE.Mesh(outerTorusGeom, ringMat);
  ringGroup.add(outerRing);

  // Inner energy ring with glowing accent
  const innerTorusGeom = new THREE.TorusGeometry(28, 0.6, 16, 64);
  const energyMat = new THREE.MeshBasicMaterial({
    color: accentNeonColor,
    wireframe: true,
  });
  const innerRing = new THREE.Mesh(innerTorusGeom, energyMat);
  ringGroup.add(innerRing);

  // Central core light
  const coreLightGeom = new THREE.SphereGeometry(3.5, 24, 24);
  const coreLightMat = new THREE.MeshBasicMaterial({
    color: accentNeonColor,
  });
  const coreLightMesh = new THREE.Mesh(coreLightGeom, coreLightMat);
  ringGroup.add(coreLightMesh);

  // Point light from core
  const corePointLight = new THREE.PointLight(accentNeonColor, 4, 180);
  ringGroup.add(corePointLight);

  scene.add(ringGroup);

  // Atmospheric Particles (Rain / Plasma / Dust) - lean count for rock-solid 60+ FPS
  const particleCount = 550;
  const particleGeom = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 85;
    particlePositions[i + 1] = Math.random() * 35;
    particlePositions[i + 2] = (Math.random() - 0.5) * 85;
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const rainMat = new THREE.PointsMaterial({
    color: particleColor,
    size: particleSize,
    transparent: true,
    opacity: 0.65,
  });
  const rainParticles = new THREE.Points(particleGeom, rainMat);
  scene.add(rainParticles);

  return { obstacles, explosiveBarrels, ringObject: ringGroup, rainParticles };
}

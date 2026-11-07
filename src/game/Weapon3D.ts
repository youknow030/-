import * as THREE from 'three';
import { WeaponConfig } from '../types/game';
import { WEAPON_SKINS } from '../data/weaponsData';

/**
 * Procedural 3D Weapon Model Builder
 * Constructs detailed multi-part sci-fi firearms with attachments and glowing energy accents
 */

export function createProceduralWeaponModel(
  weaponConfig: WeaponConfig,
  isFirstPerson: boolean = true
): THREE.Group {
  const root = new THREE.Group();
  root.name = `weapon_${weaponConfig.id}`;

  const skin = WEAPON_SKINS.find((s) => s.id === weaponConfig.selectedSkin) || WEAPON_SKINS[0];

  // PBR Materials
  const primaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.primaryColor),
    metalness: 0.85,
    roughness: 0.25,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.accentColor),
    metalness: 0.7,
    roughness: 0.35,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(skin.glowColor),
  });

  const darkGripMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0c0f14'),
    metalness: 0.2,
    roughness: 0.85,
  });

  const opticGlassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#00f0ff'),
    transmission: 0.85,
    opacity: 0.45,
    transparent: true,
    roughness: 0.1,
    ior: 1.5,
  });

  // Base dimensions vary by weapon
  const scale = isFirstPerson ? 1 : 1.35;
  const gunBody = new THREE.Group();
  gunBody.scale.set(scale, scale, scale);

  if (weaponConfig.id === 'AR-09' || weaponConfig.id === 'SR-12') {
    // Upper & Lower Receiver
    const receiverGeom = new THREE.BoxGeometry(0.08, 0.12, 0.45);
    const receiver = new THREE.Mesh(receiverGeom, primaryMat);
    receiver.position.set(0, 0, 0);
    gunBody.add(receiver);

    // Barrel
    const barrelLength = weaponConfig.id === 'SR-12' ? 0.55 : 0.35;
    const barrelGeom = new THREE.CylinderGeometry(0.016, 0.016, barrelLength, 16);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, secondaryMat);
    barrel.position.set(0, 0.02, -0.22 - barrelLength / 2);
    gunBody.add(barrel);

    // Handguard / Shroud
    const handguardGeom = new THREE.BoxGeometry(0.075, 0.09, barrelLength * 0.7);
    const handguard = new THREE.Mesh(handguardGeom, primaryMat);
    handguard.position.set(0, 0.02, -0.22 - (barrelLength * 0.7) / 2);
    gunBody.add(handguard);

    // Tactical Rail
    const railGeom = new THREE.BoxGeometry(0.04, 0.015, 0.38);
    const rail = new THREE.Mesh(railGeom, secondaryMat);
    rail.position.set(0, 0.068, -0.05);
    gunBody.add(rail);

    // Glowing energy strip on side
    const energyStripGeom = new THREE.BoxGeometry(0.082, 0.012, 0.28);
    const energyStrip = new THREE.Mesh(energyStripGeom, glowMat);
    energyStrip.position.set(0, 0.01, 0);
    gunBody.add(energyStrip);

    // Pistol Grip
    const gripGeom = new THREE.BoxGeometry(0.05, 0.16, 0.07);
    const grip = new THREE.Mesh(gripGeom, darkGripMat);
    grip.position.set(0, -0.1, 0.12);
    grip.rotation.x = -0.3;
    gunBody.add(grip);

    // Stock
    const stockGeom = new THREE.BoxGeometry(0.055, 0.11, 0.22);
    const stock = new THREE.Mesh(stockGeom, primaryMat);
    stock.position.set(0, -0.01, 0.3);
    gunBody.add(stock);

    // Magazine
    const magLen = weaponConfig.attachments.magazine === 'mag_extended' ? 0.24 : 0.18;
    const magGeom = new THREE.BoxGeometry(0.045, magLen, 0.09);
    const mag = new THREE.Mesh(magGeom, secondaryMat);
    mag.position.set(0, -0.08 - magLen / 2 + 0.05, -0.06);
    mag.rotation.x = 0.15;
    gunBody.add(mag);

    // Scope / Optic
    const scopeType = weaponConfig.attachments.scope || 'scope_holo';
    const scopeGroup = new THREE.Group();
    scopeGroup.name = 'optic_attachment';

    if (scopeType === 'scope_sniper_4x' || weaponConfig.id === 'SR-12') {
      const scopeBody = new THREE.CylinderGeometry(0.026, 0.03, 0.24, 16);
      scopeBody.rotateX(Math.PI / 2);
      const scopeMesh = new THREE.Mesh(scopeBody, secondaryMat);
      scopeMesh.position.set(0, 0.11, -0.05);
      scopeGroup.add(scopeMesh);

      const lensGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.01, 16);
      lensGeom.rotateX(Math.PI / 2);
      const lens = new THREE.Mesh(lensGeom, opticGlassMat);
      lens.position.set(0, 0.11, 0.07);
      scopeGroup.add(lens);
    } else {
      // Holo sight
      const holoFrame = new THREE.BoxGeometry(0.05, 0.06, 0.08);
      const holo = new THREE.Mesh(holoFrame, secondaryMat);
      holo.position.set(0, 0.1, -0.04);
      scopeGroup.add(holo);

      const glassGeom = new THREE.BoxGeometry(0.035, 0.04, 0.005);
      const glass = new THREE.Mesh(glassGeom, opticGlassMat);
      glass.position.set(0, 0.105, -0.04);
      scopeGroup.add(glass);
    }
    gunBody.add(scopeGroup);

    // Foregrip
    if (weaponConfig.attachments.grip === 'grip_tactical') {
      const fgGripGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.12, 12);
      const fgMesh = new THREE.Mesh(fgGripGeom, darkGripMat);
      fgMesh.position.set(0, -0.08, -0.22);
      gunBody.add(fgMesh);
    }

    // Muzzle Attachment
    const muzzleType = weaponConfig.attachments.muzzle || 'muzzle_standard';
    const muzzleLen = muzzleType === 'muzzle_suppressor' ? 0.18 : 0.07;
    const muzzleRadius = muzzleType === 'muzzle_suppressor' ? 0.026 : 0.022;
    const muzzleGeom = new THREE.CylinderGeometry(muzzleRadius, muzzleRadius, muzzleLen, 16);
    muzzleGeom.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeom, primaryMat);
    muzzle.position.set(0, 0.02, -0.22 - barrelLength - muzzleLen / 2);
    gunBody.add(muzzle);

  } else if (weaponConfig.id === 'VX-7') {
    // SMG: Compact body, forward mag
    const bodyGeom = new THREE.BoxGeometry(0.07, 0.13, 0.32);
    const body = new THREE.Mesh(bodyGeom, primaryMat);
    gunBody.add(body);

    const barrelGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 12);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, secondaryMat);
    barrel.position.set(0, 0.02, -0.22);
    gunBody.add(barrel);

    const gripGeom = new THREE.BoxGeometry(0.045, 0.14, 0.06);
    const grip = new THREE.Mesh(gripGeom, darkGripMat);
    grip.position.set(0, -0.1, 0.08);
    grip.rotation.x = -0.25;
    gunBody.add(grip);

    // Front curved mag
    const magGeom = new THREE.BoxGeometry(0.04, 0.2, 0.06);
    const mag = new THREE.Mesh(magGeom, secondaryMat);
    mag.position.set(0, -0.12, -0.06);
    mag.rotation.x = 0.2;
    gunBody.add(mag);

    // Glow line
    const glowGeom = new THREE.BoxGeometry(0.072, 0.01, 0.2);
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    glowMesh.position.set(0, 0.03, -0.02);
    gunBody.add(glowMesh);

    // Red dot
    const reflexGeom = new THREE.BoxGeometry(0.04, 0.045, 0.06);
    const reflex = new THREE.Mesh(reflexGeom, secondaryMat);
    reflex.position.set(0, 0.09, -0.02);
    reflex.name = 'optic_attachment';
    gunBody.add(reflex);

  } else if (weaponConfig.id === 'Pulse-X') {
    // Energy Weapon: Dual rail emitter, glowing core battery
    const coreBodyGeom = new THREE.BoxGeometry(0.09, 0.14, 0.38);
    const coreBody = new THREE.Mesh(coreBodyGeom, primaryMat);
    gunBody.add(coreBody);

    // Plasma Chamber (Cylinder with glow)
    const plasmaGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.18, 16);
    plasmaGeom.rotateX(Math.PI / 2);
    const plasmaCore = new THREE.Mesh(plasmaGeom, glowMat);
    plasmaCore.position.set(0, 0.02, -0.04);
    gunBody.add(plasmaCore);

    // Dual Emitter Prongs
    [-0.04, 0.04].forEach((px) => {
      const prongGeom = new THREE.BoxGeometry(0.016, 0.03, 0.25);
      const prong = new THREE.Mesh(prongGeom, secondaryMat);
      prong.position.set(px, 0.02, -0.28);
      gunBody.add(prong);
    });

    const gripGeom = new THREE.BoxGeometry(0.05, 0.15, 0.07);
    const grip = new THREE.Mesh(gripGeom, darkGripMat);
    grip.position.set(0, -0.11, 0.09);
    grip.rotation.x = -0.3;
    gunBody.add(grip);

    // Pulse-X Top Sight (named optic_attachment so it hides on ADS)
    const pulseSight = new THREE.Group();
    pulseSight.name = 'optic_attachment';
    const holoFrame = new THREE.BoxGeometry(0.05, 0.055, 0.08);
    const holo = new THREE.Mesh(holoFrame, secondaryMat);
    holo.position.set(0, 0.095, -0.04);
    pulseSight.add(holo);
    const glassGeom = new THREE.BoxGeometry(0.035, 0.04, 0.005);
    const glass = new THREE.Mesh(glassGeom, opticGlassMat);
    glass.position.set(0, 0.1, -0.04);
    pulseSight.add(glass);
    gunBody.add(pulseSight);

  } else if (weaponConfig.id === 'SG-4') {
    // Shotgun: Dual tube magazine, pump slide
    const receiverGeom = new THREE.BoxGeometry(0.08, 0.13, 0.36);
    const receiver = new THREE.Mesh(receiverGeom, primaryMat);
    gunBody.add(receiver);

    const barrelGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.38, 16);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeom, secondaryMat);
    barrel.position.set(0, 0.03, -0.32);
    gunBody.add(barrel);

    const tubeGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.34, 16);
    tubeGeom.rotateX(Math.PI / 2);
    const tube = new THREE.Mesh(tubeGeom, secondaryMat);
    tube.position.set(0, -0.01, -0.3);
    gunBody.add(tube);

    const pumpGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.14, 16);
    pumpGeom.rotateX(Math.PI / 2);
    const pump = new THREE.Mesh(pumpGeom, darkGripMat);
    pump.position.set(0, -0.01, -0.26);
    gunBody.add(pump);

    const gripGeom = new THREE.BoxGeometry(0.05, 0.14, 0.08);
    const grip = new THREE.Mesh(gripGeom, darkGripMat);
    grip.position.set(0, -0.1, 0.12);
    grip.rotation.x = -0.28;
    gunBody.add(grip);

    // Shotgun Top Sight / Optic Attachment (named optic_attachment so it hides on ADS)
    const sgSight = new THREE.Group();
    sgSight.name = 'optic_attachment';

    const sgScopeType = weaponConfig.attachments.scope || 'scope_iron';
    if (sgScopeType === 'scope_holo') {
      const hFrame = new THREE.BoxGeometry(0.05, 0.06, 0.08);
      const hMesh = new THREE.Mesh(hFrame, secondaryMat);
      hMesh.position.set(0, 0.1, -0.04);
      sgSight.add(hMesh);

      const gGeom = new THREE.BoxGeometry(0.035, 0.04, 0.005);
      const gMesh = new THREE.Mesh(gGeom, opticGlassMat);
      gMesh.position.set(0, 0.105, -0.04);
      sgSight.add(gMesh);
    } else if (sgScopeType === 'scope_reflex') {
      const rGeom = new THREE.BoxGeometry(0.04, 0.045, 0.06);
      const rMesh = new THREE.Mesh(rGeom, secondaryMat);
      rMesh.position.set(0, 0.09, -0.04);
      sgSight.add(rMesh);
    } else {
      // Tactical Ghost Ring & Front Bead Sight
      const ringGeom = new THREE.TorusGeometry(0.014, 0.003, 8, 16);
      const ring = new THREE.Mesh(ringGeom, darkGripMat);
      ring.position.set(0, 0.08, 0.04);
      sgSight.add(ring);

      const postGeom = new THREE.BoxGeometry(0.006, 0.018, 0.006);
      const post = new THREE.Mesh(postGeom, darkGripMat);
      post.position.set(0, 0.062, -0.36);
      sgSight.add(post);

      const beadGeom = new THREE.SphereGeometry(0.004, 8, 8);
      const bead = new THREE.Mesh(beadGeom, glowMat);
      bead.position.set(0, 0.072, -0.36);
      sgSight.add(bead);
    }
    gunBody.add(sgSight);

  } else {
    // P-01 Tactical Pistol
    const slideGeom = new THREE.BoxGeometry(0.05, 0.065, 0.22);
    const slide = new THREE.Mesh(slideGeom, primaryMat);
    slide.position.set(0, 0.04, -0.02);
    gunBody.add(slide);

    const frameGeom = new THREE.BoxGeometry(0.045, 0.055, 0.18);
    const frame = new THREE.Mesh(frameGeom, secondaryMat);
    frame.position.set(0, -0.01, 0);
    gunBody.add(frame);

    const gripGeom = new THREE.BoxGeometry(0.042, 0.13, 0.06);
    const grip = new THREE.Mesh(gripGeom, darkGripMat);
    grip.position.set(0, -0.09, 0.04);
    grip.rotation.x = -0.22;
    gunBody.add(grip);

    // Glowing dot sight
    const dotGeom = new THREE.SphereGeometry(0.005, 8, 8);
    const dot = new THREE.Mesh(dotGeom, glowMat);
    dot.position.set(0, 0.075, -0.12);
    dot.name = 'optic_attachment';
    gunBody.add(dot);
  }

  // Muzzle Flash Point (invisible anchor for particle emission)
  const muzzleFlashPoint = new THREE.Object3D();
  muzzleFlashPoint.name = 'muzzleFlashPoint';
  muzzleFlashPoint.position.set(0, 0.02, -0.55);
  gunBody.add(muzzleFlashPoint);

  root.add(gunBody);
  return root;
}

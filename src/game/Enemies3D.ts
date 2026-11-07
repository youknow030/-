import * as THREE from 'three';
import { Enemy } from '../types/game';

export interface EnemyMeshWrapper {
  data: Enemy;
  group: THREE.Group;
  eyeLight?: THREE.PointLight;
  headMesh?: THREE.Mesh;
  shieldMesh?: THREE.Mesh;
  healthBarObj?: THREE.Object3D;
  healthBarFill?: THREE.Mesh;
  hitFlashTimer: number;
  deathAnimTimer: number;
  // Specific component references for new enemy types
  sniperLaserLine?: THREE.Line;
  kamikazeCore?: THREE.Mesh;
  kamikazePulseTimer?: number;
  medicRotor?: THREE.Group;
  healingBeamMesh?: THREE.Mesh;
  stealthMaterials?: THREE.Material[];
}

export function createEnemyModel(enemy: Enemy): EnemyMeshWrapper {
  const group = new THREE.Group();
  group.position.set(enemy.x, enemy.y, enemy.z);
  group.name = `enemy_${enemy.id}`;

  let eyeLight: THREE.PointLight | undefined;
  let headMesh: THREE.Mesh | undefined;
  let shieldMesh: THREE.Mesh | undefined;
  let sniperLaserLine: THREE.Line | undefined;
  let kamikazeCore: THREE.Mesh | undefined;
  let medicRotor: THREE.Group | undefined;
  let healingBeamMesh: THREE.Mesh | undefined;
  const stealthMaterials: THREE.Material[] = [];

  const isBoss = enemy.type === 'titan_boss';
  const scale = isBoss ? 2.8 : enemy.type === 'heavy' ? 1.6 : enemy.type === 'kamikaze' ? 0.75 : 1.1;

  // -------------------------------------------------------------
  // Base Standard Materials
  // -------------------------------------------------------------
  const armorMat = new THREE.MeshStandardMaterial({
    color: enemy.type === 'kamikaze' ? 0x2a1515 : enemy.type === 'support_medic' ? 0x112824 : 0x181c24,
    metalness: 0.85,
    roughness: 0.3,
  });

  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x2e3846,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Visor color:
  // - titan_boss: vibrant neon crimson
  // - kamikaze: intense hazard amber/orange
  // - support_medic: bright emerald healing green
  // - sniper: piercing ruby red
  // - stealth: ultraviolet purple / cyan
  const visorColor =
    enemy.type === 'titan_boss'
      ? 0xff0044
      : enemy.type === 'kamikaze'
      ? 0xff5500
      : enemy.type === 'support_medic'
      ? 0x00ff88
      : enemy.type === 'stealth'
      ? 0x9933ff
      : enemy.type === 'sniper'
      ? 0xff0033
      : 0xff1e00;

  const visorMat = new THREE.MeshBasicMaterial({
    color: visorColor,
  });

  // -------------------------------------------------------------
  // BRANCH BY ENEMY ARCHETYPE
  // -------------------------------------------------------------

  if (enemy.type === 'kamikaze') {
    // =========================================================
    // KAMIKAZE (自爆爬行蛛機) - Spherical arachnid explosive drone
    // =========================================================
    // Central bomb sphere
    const bombGeom = new THREE.SphereGeometry(0.55 * scale, 16, 16);
    const bombMat = new THREE.MeshStandardMaterial({
      color: 0x331008,
      metalness: 0.9,
      roughness: 0.2,
    });
    const bombMesh = new THREE.Mesh(bombGeom, bombMat);
    bombMesh.position.y = 0.6 * scale;
    bombMesh.castShadow = true;
    group.add(bombMesh);
    headMesh = bombMesh; // Treat bomb center as weak point

    // Pulsing glowing explosive core
    const coreGeom = new THREE.IcosahedronGeometry(0.35 * scale, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      wireframe: true,
    });
    kamikazeCore = new THREE.Mesh(coreGeom, coreMat);
    kamikazeCore.position.set(0, 0.6 * scale, 0);
    group.add(kamikazeCore);

    // Hazard blinking light
    eyeLight = new THREE.PointLight(0xff5500, 2.5, 6 * scale);
    eyeLight.position.set(0, 0.7 * scale, 0);
    group.add(eyeLight);

    // 4 Quadruped Arachnid articulated legs
    for (let legIdx = 0; legIdx < 4; legIdx++) {
      const legAngle = (legIdx * Math.PI) / 2 + Math.PI / 4;
      const legGroup = new THREE.Group();
      legGroup.position.set(0, 0.5 * scale, 0);
      legGroup.rotation.y = legAngle;

      // Upper leg
      const upperLegGeom = new THREE.CylinderGeometry(0.06 * scale, 0.05 * scale, 0.7 * scale, 8);
      upperLegGeom.rotateZ(Math.PI / 3);
      const upperLeg = new THREE.Mesh(upperLegGeom, jointMat);
      upperLeg.position.set(0.35 * scale, 0.15 * scale, 0);
      legGroup.add(upperLeg);

      // Lower leg digging claw
      const clawGeom = new THREE.ConeGeometry(0.06 * scale, 0.7 * scale, 8);
      clawGeom.rotateZ(-Math.PI / 6);
      const claw = new THREE.Mesh(clawGeom, armorMat);
      claw.position.set(0.65 * scale, -0.3 * scale, 0);
      legGroup.add(claw);

      group.add(legGroup);
    }
  } else if (enemy.type === 'support_medic') {
    // =========================================================
    // SUPPORT MEDIC (奈米維修信標機) - Aerial hovering repair drone
    // =========================================================
    const hoverGroup = new THREE.Group();
    hoverGroup.position.y = 1.6 * scale; // Hovers at eye level

    // Main central chassis
    const bodyGeom = new THREE.OctahedronGeometry(0.48 * scale, 1);
    const body = new THREE.Mesh(bodyGeom, armorMat);
    body.castShadow = true;
    hoverGroup.add(body);
    headMesh = body;

    // Glowing medical green reactor
    const medCoreGeom = new THREE.SphereGeometry(0.24 * scale, 12, 12);
    const medCore = new THREE.Mesh(medCoreGeom, visorMat);
    hoverGroup.add(medCore);

    // Twin horizontal rotating anti-grav rings
    medicRotor = new THREE.Group();
    const ringGeom = new THREE.TorusGeometry(0.65 * scale, 0.04 * scale, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      metalness: 0.8,
      emissive: 0x005522,
    });
    const ring1 = new THREE.Mesh(ringGeom, ringMat);
    ring1.rotation.x = Math.PI / 2;
    medicRotor.add(ring1);
    hoverGroup.add(medicRotor);

    // Green beacon light
    eyeLight = new THREE.PointLight(0x00ff88, 2.0, 9 * scale);
    eyeLight.position.set(0, 0.2 * scale, 0);
    hoverGroup.add(eyeLight);

    // Healing nanite emitter dish below
    const dishGeom = new THREE.ConeGeometry(0.25 * scale, 0.3 * scale, 12);
    dishGeom.rotateX(Math.PI);
    const dish = new THREE.Mesh(dishGeom, jointMat);
    dish.position.set(0, -0.4 * scale, 0);
    hoverGroup.add(dish);

    group.add(hoverGroup);
  } else if (enemy.type === 'stealth') {
    // =========================================================
    // STEALTH (光學迷彩幽靈機) - Shimmering semi-transparent infiltrator
    // =========================================================
    const cloakMat = new THREE.MeshPhysicalMaterial({
      color: 0x221144,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.35,
      reflectivity: 0.8,
    });
    stealthMaterials.push(cloakMat);

    // Slender Torso
    const torsoGeom = new THREE.BoxGeometry(0.6 * scale, 0.85 * scale, 0.35 * scale);
    const torso = new THREE.Mesh(torsoGeom, cloakMat);
    torso.position.y = 1.2 * scale;
    group.add(torso);

    // Sleek faceted head
    const stealthHeadGeom = new THREE.ConeGeometry(0.25 * scale, 0.45 * scale, 6);
    stealthHeadGeom.rotateX(-Math.PI / 4);
    headMesh = new THREE.Mesh(stealthHeadGeom, cloakMat);
    headMesh.position.set(0, 1.8 * scale, 0.05 * scale);
    group.add(headMesh);

    // Shimmering Violet Eye Visor
    const stealthVisorGeom = new THREE.BoxGeometry(0.3 * scale, 0.04 * scale, 0.05 * scale);
    const stealthVisor = new THREE.Mesh(stealthVisorGeom, visorMat);
    stealthVisor.position.set(0, 1.75 * scale, 0.2 * scale);
    group.add(stealthVisor);

    eyeLight = new THREE.PointLight(0xaa44ff, 1.2, 5 * scale);
    eyeLight.position.set(0, 1.75 * scale, 0.3 * scale);
    group.add(eyeLight);

    // Dual Glowing Plasma Blades
    [-0.45 * scale, 0.45 * scale].forEach((sideX) => {
      const bladeGeom = new THREE.BoxGeometry(0.04 * scale, 0.7 * scale, 0.08 * scale);
      bladeGeom.rotateX(Math.PI / 3);
      const bladeMat = new THREE.MeshBasicMaterial({ color: 0xaa22ff });
      const blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.set(sideX, 1.0 * scale, 0.4 * scale);
      group.add(blade);
    });

    // Legs
    [-0.2 * scale, 0.2 * scale].forEach((legX) => {
      const legGeom = new THREE.CylinderGeometry(0.06 * scale, 0.04 * scale, 0.8 * scale, 8);
      const leg = new THREE.Mesh(legGeom, cloakMat);
      leg.position.set(legX, 0.5 * scale, 0);
      group.add(leg);
    });
  } else if (enemy.type === 'sniper') {
    // =========================================================
    // SNIPER (暗影狙擊機) - High-vantage tall chassis with long sniper cannon
    // =========================================================
    // Tall Slender Torso
    const torsoGeom = new THREE.BoxGeometry(0.55 * scale, 1.0 * scale, 0.4 * scale);
    const torso = new THREE.Mesh(torsoGeom, armorMat);
    torso.position.y = 1.35 * scale;
    torso.castShadow = true;
    group.add(torso);

    // Sensor Head with Target Scanner Antennas
    const headGeom = new THREE.BoxGeometry(0.35 * scale, 0.3 * scale, 0.5 * scale);
    headMesh = new THREE.Mesh(headGeom, armorMat);
    headMesh.position.set(0, 1.95 * scale, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Monocular sniper scope lens
    const lensGeom = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 0.15 * scale, 12);
    lensGeom.rotateX(Math.PI / 2);
    const lens = new THREE.Mesh(lensGeom, visorMat);
    lens.position.set(0, 1.95 * scale, 0.3 * scale);
    group.add(lens);

    // Sensor antenna
    const antGeom = new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.5 * scale, 6);
    const ant = new THREE.Mesh(antGeom, jointMat);
    ant.position.set(0.15 * scale, 2.25 * scale, -0.1 * scale);
    group.add(ant);

    eyeLight = new THREE.PointLight(0xff0033, 2.0, 9 * scale);
    eyeLight.position.set(0, 1.95 * scale, 0.4 * scale);
    group.add(eyeLight);

    // Heavy High-Velocity Anti-Materiel Rail Sniper Rifle on right arm
    const rifleBarrelGeom = new THREE.CylinderGeometry(0.06 * scale, 0.06 * scale, 1.5 * scale, 10);
    rifleBarrelGeom.rotateX(Math.PI / 2);
    const rifleBarrel = new THREE.Mesh(rifleBarrelGeom, jointMat);
    rifleBarrel.position.set(0.42 * scale, 1.45 * scale, 0.8 * scale);
    group.add(rifleBarrel);

    const rifleMuzzleGeom = new THREE.BoxGeometry(0.12 * scale, 0.12 * scale, 0.25 * scale);
    const rifleMuzzle = new THREE.Mesh(rifleMuzzleGeom, armorMat);
    rifleMuzzle.position.set(0.42 * scale, 1.45 * scale, 1.55 * scale);
    group.add(rifleMuzzle);

    // Visible red targeting guide laser line (aims towards player)
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.42 * scale, 1.45 * scale, 1.6 * scale),
      new THREE.Vector3(0.42 * scale, 1.45 * scale, 35 * scale),
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.65,
    });
    sniperLaserLine = new THREE.Line(lineGeom, lineMat);
    group.add(sniperLaserLine);

    // Slender Tripod / Biped legs
    [-0.22 * scale, 0.22 * scale].forEach((legX) => {
      const legGeom = new THREE.CylinderGeometry(0.07 * scale, 0.06 * scale, 0.9 * scale, 8);
      const leg = new THREE.Mesh(legGeom, jointMat);
      leg.position.set(legX, 0.55 * scale, 0);
      group.add(leg);
    });
  } else {
    // =========================================================
    // STANDARD / ASSAULT / SHIELD / HEAVY / TITAN BOSS
    // =========================================================
    // 1. Torso / Chassis
    const torsoGeom = new THREE.BoxGeometry(0.7 * scale, 0.9 * scale, 0.5 * scale);
    const torso = new THREE.Mesh(torsoGeom, armorMat);
    torso.position.y = 1.2 * scale;
    torso.castShadow = true;
    group.add(torso);

    // Core energy reactor in chest
    const coreGeom = new THREE.SphereGeometry(0.18 * scale, 12, 12);
    const coreMesh = new THREE.Mesh(coreGeom, visorMat);
    coreMesh.position.set(0, 1.2 * scale, 0.26 * scale);
    group.add(coreMesh);

    // 2. Head / Sensor Turret
    const headGeom = new THREE.BoxGeometry(0.45 * scale, 0.35 * scale, 0.45 * scale);
    headMesh = new THREE.Mesh(headGeom, armorMat);
    headMesh.position.set(0, 1.8 * scale, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Visor Eye
    const visorGeom = new THREE.BoxGeometry(0.35 * scale, 0.08 * scale, 0.05 * scale);
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 1.8 * scale, 0.23 * scale);
    group.add(visor);

    eyeLight = new THREE.PointLight(enemy.type === 'titan_boss' ? 0xff0044 : 0xff2a00, 1.8, 8 * scale);
    eyeLight.position.set(0, 1.8 * scale, 0.4 * scale);
    group.add(eyeLight);

    // 3. Arms / Weapons
    [-0.55 * scale, 0.55 * scale].forEach((sideX) => {
      const shoulderGeom = new THREE.BoxGeometry(0.28 * scale, 0.25 * scale, 0.35 * scale);
      const shoulder = new THREE.Mesh(shoulderGeom, armorMat);
      shoulder.position.set(sideX, 1.5 * scale, 0);
      group.add(shoulder);

      const armGeom = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.7 * scale, 12);
      armGeom.rotateX(Math.PI / 2);
      const arm = new THREE.Mesh(armGeom, jointMat);
      arm.position.set(sideX, 1.2 * scale, 0.35 * scale);
      group.add(arm);

      const tipGeom = new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, 0.15 * scale, 12);
      tipGeom.rotateX(Math.PI / 2);
      const tip = new THREE.Mesh(tipGeom, armorMat);
      tip.position.set(sideX, 1.2 * scale, 0.7 * scale);
      group.add(tip);
    });

    // 4. Force Shield for Shield Bot & Boss
    if (enemy.type === 'shield' || isBoss) {
      const shieldEnergyMat = new THREE.MeshPhysicalMaterial({
        color: 0x00f0ff,
        transmission: 0.8,
        transparent: true,
        opacity: 0.55,
        roughness: 0.1,
      });
      const sGeom = new THREE.BoxGeometry(1.6 * scale, 1.6 * scale, 0.06);
      shieldMesh = new THREE.Mesh(sGeom, shieldEnergyMat);
      shieldMesh.position.set(0, 1.3 * scale, 0.7 * scale);
      group.add(shieldMesh);
    }

    // 5. Legs
    [-0.25 * scale, 0.25 * scale].forEach((legX) => {
      const legUpperGeom = new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, 0.6 * scale, 10);
      const legUpper = new THREE.Mesh(legUpperGeom, jointMat);
      legUpper.position.set(legX, 0.6 * scale, 0);
      group.add(legUpper);

      const footGeom = new THREE.BoxGeometry(0.2 * scale, 0.12 * scale, 0.35 * scale);
      const foot = new THREE.Mesh(footGeom, armorMat);
      foot.position.set(legX, 0.06 * scale, 0.06 * scale);
      group.add(foot);
    });
  }

  // -------------------------------------------------------------
  // Floating 3D Health Bar Billboard
  // -------------------------------------------------------------
  const barY =
    isBoss ? 3.4 * scale : enemy.type === 'kamikaze' ? 1.4 : enemy.type === 'support_medic' ? 2.4 : 2.3 * scale;
  const healthBarGroup = new THREE.Group();
  healthBarGroup.position.set(0, barY, 0);

  const bgBarGeom = new THREE.PlaneGeometry(1.2 * (isBoss ? 1.8 : 1), 0.12 * (isBoss ? 1.5 : 1));
  const bgBarMat = new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide });
  const bgBar = new THREE.Mesh(bgBarGeom, bgBarMat);
  healthBarGroup.add(bgBar);

  const fillBarGeom = new THREE.PlaneGeometry(1.16 * (isBoss ? 1.8 : 1), 0.09 * (isBoss ? 1.5 : 1));
  fillBarGeom.translate(0.58 * (isBoss ? 1.8 : 1), 0, 0); // anchor left
  const fillBarColor =
    isBoss
      ? 0xff0055
      : enemy.type === 'kamikaze'
      ? 0xff6600
      : enemy.type === 'support_medic'
      ? 0x00ff88
      : enemy.type === 'stealth'
      ? 0xbf55ec
      : 0x00f0ff;

  const fillBarMat = new THREE.MeshBasicMaterial({
    color: fillBarColor,
    side: THREE.DoubleSide,
  });
  const healthBarFill = new THREE.Mesh(fillBarGeom, fillBarMat);
  healthBarFill.position.set(-0.58 * (isBoss ? 1.8 : 1), 0, 0.002);
  healthBarGroup.add(healthBarFill);

  group.add(healthBarGroup);

  return {
    data: enemy,
    group,
    eyeLight,
    headMesh,
    shieldMesh,
    healthBarObj: healthBarGroup,
    healthBarFill,
    hitFlashTimer: 0,
    deathAnimTimer: 0,
    sniperLaserLine,
    kamikazeCore,
    medicRotor,
    healingBeamMesh,
    stealthMaterials,
  };
}

// Laser Projectile Mesh for Enemy Attacks
export interface EnemyLaserBullet {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
}

export function createLaserBullet(
  startPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  damage: number = 15,
  color: number = 0xff1144,
  speed: number = 38
): EnemyLaserBullet {
  const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();

  const geom = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8);
  geom.rotateX(Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(startPos);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);

  return {
    mesh,
    direction: dir,
    speed,
    damage,
    distanceTraveled: 0,
    maxDistance: 75,
  };
}

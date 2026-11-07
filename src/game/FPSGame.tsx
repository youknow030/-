import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WeaponConfig, PlayerStats, Enemy, MissionChapter, RadioCommsMessage } from '../types/game';
import { buildZeroFrontArena, ArenaObstacle, ExplosiveBarrel } from './Environment3D';
import { createProceduralWeaponModel } from './Weapon3D';
import { createEnemyModel, EnemyMeshWrapper, createLaserBullet, EnemyLaserBullet } from './Enemies3D';
import { sound } from '../utils/audio';
import { HUD } from '../components/HUD';
import { CommsDialog } from '../components/CommsDialog';
import { MissionCompleteModal } from '../components/MissionCompleteModal';
import { RotateCcw } from 'lucide-react';

interface FPSGameProps {
  mission: MissionChapter;
  weapons: WeaponConfig[];
  currentWeaponIndex: number;
  playerStats: PlayerStats;
  mouseSensitivity: number;
  fov: number;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
  onSelectWeapon: (idx: number) => void;
  onMissionFinished: (rewards: { exp: number; credits: number; materials: number }) => void;
  onBackToMenu: () => void;
  onOpenArmory: () => void;
  onNextMission?: () => void;
}

const MISSION_TIME_LIMIT = 150; // 2分30秒作戰倒數 (秒)

export const FPSGame: React.FC<FPSGameProps> = ({
  mission,
  weapons,
  currentWeaponIndex,
  playerStats,
  mouseSensitivity,
  fov,
  onUpdateStats,
  onSelectWeapon,
  onMissionFinished,
  onBackToMenu,
  onOpenArmory,
  onNextMission,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const switchWeaponRef = useRef<(idx: number) => void>(() => {});

  // Combat Session Key for instant in-memory restart without page reload
  const [combatSessionKey, setCombatSessionKey] = useState(0);

  // Gameplay States for HUD & Mission Conditions
  const [hudStats, setHudStats] = useState<PlayerStats>(playerStats);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponConfig>(weapons[currentWeaponIndex]);
  const [enemiesList, setEnemiesList] = useState<Enemy[]>([]);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(MISSION_TIME_LIMIT);
  const [gameOverReason, setGameOverReason] = useState<'hp_zero' | 'timeout'>('hp_zero');
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0, angle: 0 });
  const [isAds, setIsAds] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);
  const [hitMarker, setHitMarker] = useState<{ visible: boolean; isHeadshot: boolean; damage: number } | null>(null);
  const [hurtFlash, setHurtFlash] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMissionComplete, setIsMissionComplete] = useState(false);
  const [missionStats, setMissionStats] = useState({
    timeSeconds: 0,
    shotsFired: 0,
    shotsHit: 0,
    enemiesKilled: 0,
    totalEnemies: 0,
    secondaryCompleted: true,
  });

  // Radio Comms Message
  const [currentComms, setCurrentComms] = useState<RadioCommsMessage | null>(null);

  // Mutable game state in refs to avoid re-mounting Three.js
  const stateRef = useRef({
    playerStats: { ...playerStats },
    currentWeapon: { ...weapons[currentWeaponIndex] },
    weapons: [...weapons],
    weaponIdx: currentWeaponIndex,
    enemiesKilled: 0,
    totalEnemies: mission.targetCount,
    timeRemaining: MISSION_TIME_LIMIT,
    shotsFired: 0,
    shotsHit: 0,
    startTime: Date.now(),
    isAds: false,
    isReloading: false,
    reloadTimer: 0,
    lastShotTime: 0,
    isPaused: false,
    isGameOver: false,
    isMissionComplete: false,
    hurtTimer: 0,
    shieldRegenCooldown: 0,
    recoilImpulse: { x: 0, y: 0, z: 0 },
    keys: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      crouch: false,
      jump: false,
    },
    mouse: {
      yaw: 0,
      pitch: 0,
    },
    cameraPos: new THREE.Vector3(0, 1.7, 10),
    velocity: new THREE.Vector3(),
    onGround: true,
    isMouseDown: false,
    hadChamberedRoundOnReload: false,
  });

  // Keep stateRef synced with props
  useEffect(() => {
    stateRef.current.weapons = weapons;
    stateRef.current.currentWeapon = weapons[currentWeaponIndex];
    stateRef.current.weaponIdx = currentWeaponIndex;
    setCurrentWeapon(weapons[currentWeaponIndex]);
  }, [weapons, currentWeaponIndex]);

  // Initial Comms message on mission deployment
  useEffect(() => {
    sound.playRadioBeep();
    setCurrentComms({
      id: 'briefing_1',
      sender: 'Aira',
      senderTitle: '情報通訊官',
      message: `凱恩，已抵達【${mission.title}】邊緣。雷達已上線，注意前方的敵對巡邏警衛！`,
      durationMs: 4500,
    });

    const timer = setTimeout(() => {
      setCurrentComms(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [mission]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Dynamic Atmosphere & Lighting based on mission environment
    const envConfigs: Record<
      string,
      { bg: number; fog: number; fogDensity: number; keyLight: number; hemiSky: number; hemiGround: number }
    > = {
      industrial: { bg: 0x060c18, fog: 0x060c18, fogDensity: 0.022, keyLight: 0xffeedd, hemiSky: 0x00d2ff, hemiGround: 0x050b14 },
      lab: { bg: 0x050f1a, fog: 0x050f1a, fogDensity: 0.020, keyLight: 0xd0f0ff, hemiSky: 0x38bdf8, hemiGround: 0x0a192f },
      city: { bg: 0x080616, fog: 0x080616, fogDensity: 0.025, keyLight: 0xffd0f0, hemiSky: 0xc084fc, hemiGround: 0x05030f },
      orbital: { bg: 0x010206, fog: 0x010206, fogDensity: 0.012, keyLight: 0xffffff, hemiSky: 0x93c5fd, hemiGround: 0x02040a },
      reactor: { bg: 0x140608, fog: 0x140608, fogDensity: 0.024, keyLight: 0xff9944, hemiSky: 0xf97316, hemiGround: 0x1f060a },
      mech_factory: { bg: 0x0e0c0a, fog: 0x0e0c0a, fogDensity: 0.022, keyLight: 0xffd580, hemiSky: 0xfbbf24, hemiGround: 0x181008 },
      core: { bg: 0x02101e, fog: 0x02101e, fogDensity: 0.020, keyLight: 0x88eeff, hemiSky: 0x00f0ff, hemiGround: 0x020b14 },
      abyss: { bg: 0x090114, fog: 0x090114, fogDensity: 0.022, keyLight: 0xcc66ff, hemiSky: 0xa855f7, hemiGround: 0x120120 },
      choice: { bg: 0x07111d, fog: 0x07111d, fogDensity: 0.018, keyLight: 0xffeedd, hemiSky: 0x38bdf8, hemiGround: 0x0c1b2c },
    };

    const curEnv = envConfigs[mission.environment] || envConfigs.industrial;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(curEnv.bg);
    scene.fog = new THREE.FogExp2(curEnv.fog, curEnv.fogDensity);

    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 150);
    camera.position.set(0, 1.7, 10);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    renderer.setSize(width, height);
    // Limit pixel ratio to 1.5 to prevent massive 4K fillrate stalls on Retina screens while maintaining razor-sharp rendering
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    // Studio & Atmospheric Lighting
    const keyLight = new THREE.DirectionalLight(curEnv.keyLight, 1.8);
    keyLight.position.set(20, 40, 20);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 5;
      keyLight.shadow.camera.far = 90;
      keyLight.shadow.camera.left = -30;
      keyLight.shadow.camera.right = 30;
      keyLight.shadow.camera.top = 30;
      keyLight.shadow.camera.bottom = -30;
      keyLight.shadow.bias = -0.0004;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(curEnv.hemiSky, curEnv.hemiGround, 1.2);
    scene.add(hemiLight);

    // Build Arena Environment
    const { obstacles, explosiveBarrels, ringObject, rainParticles } = buildZeroFrontArena(scene, mission.environment);

    // Build Gun Node attached to Camera
    const gunContainer = new THREE.Group();
    camera.add(gunContainer);

    let currentGunMesh = createProceduralWeaponModel(stateRef.current.currentWeapon, true);
    gunContainer.add(currentGunMesh);

    // Muzzle Flash Point Light
    const muzzleLight = new THREE.PointLight(0x00ffff, 0, 15);
    muzzleLight.position.set(0.18, -0.15, -0.5);
    camera.add(muzzleLight);

    // Spawn Enemies accurately according to mission composition
    const enemiesWrappers: EnemyMeshWrapper[] = [];
    const laserBullets: EnemyLaserBullet[] = [];
    const totalCount = mission.targetCount;

    // Build list of enemy types based on mission specification
    let typesToSpawn: Enemy['type'][] = [];
    if (mission.enemyComposition.boss) {
      typesToSpawn.push('titan_boss');
    }
    for (let k = 0; k < (mission.enemyComposition.heavy || 0); k++) typesToSpawn.push('heavy');
    for (let k = 0; k < (mission.enemyComposition.shield || 0); k++) typesToSpawn.push('shield');
    for (let k = 0; k < (mission.enemyComposition.sniper || 0); k++) typesToSpawn.push('sniper');
    for (let k = 0; k < (mission.enemyComposition.kamikaze || 0); k++) typesToSpawn.push('kamikaze');
    for (let k = 0; k < (mission.enemyComposition.stealth || 0); k++) typesToSpawn.push('stealth');
    for (let k = 0; k < (mission.enemyComposition.support_medic || 0); k++) typesToSpawn.push('support_medic');
    for (let k = 0; k < (mission.enemyComposition.assault || 0); k++) typesToSpawn.push('assault');
    for (let k = 0; k < (mission.enemyComposition.patrol || 0); k++) typesToSpawn.push('patrol');

    while (typesToSpawn.length < totalCount) {
      const idx = typesToSpawn.length % 4;
      typesToSpawn.push(idx === 0 ? 'assault' : idx === 1 ? 'kamikaze' : idx === 2 ? 'stealth' : 'patrol');
    }
    if (typesToSpawn.length > totalCount) {
      const hasBoss = typesToSpawn.includes('titan_boss');
      typesToSpawn = typesToSpawn.slice(0, totalCount);
      if (hasBoss && !typesToSpawn.includes('titan_boss')) {
        typesToSpawn[typesToSpawn.length - 1] = 'titan_boss';
      }
    }

    // Build complete enemy dataset for the mission
    const allEnemiesData: Enemy[] = [];
    for (let i = 0; i < totalCount; i++) {
      const angle = (i / Math.max(1, totalCount)) * Math.PI * 1.8 + 0.2;
      const dist = 14 + (i % 4) * 5 + Math.random() * 5;
      const ex = Math.sin(angle) * dist;
      const ez = -Math.cos(angle) * dist - 6;

      const type = typesToSpawn[i] || 'patrol';

      let enemyName = '巡邏哨兵';
      let maxHp = 65;
      let shieldVal = 0;
      let speed = 2.5;
      let damage = 10;

      if (type === 'titan_boss') {
        if (mission.environment === 'abyss') {
          enemyName = '虛空泰坦 (VOID APEX COLOSSUS)';
          maxHp = 1200;
          damage = 30;
        } else if (mission.environment === 'core') {
          enemyName = '天頂守衛者 (APEX TITAN)';
          maxHp = 850;
          damage = 24;
        } else {
          enemyName = '重裝泰坦原型機 (TITAN PROTO)';
          maxHp = 750;
          damage = 22;
        }
        speed = 2.0;
      } else if (type === 'heavy') {
        if (mission.environment === 'choice') {
          enemyName = '總部裁決機兵 (ARBITER SENTINEL)';
          maxHp = 350;
          damage = 20;
        } else {
          enemyName = '重裝執法者';
          maxHp = 220;
          damage = 18;
        }
        speed = 2.0;
      } else if (type === 'shield') {
        if (mission.environment === 'choice') {
          enemyName = '聖堂防衛力場兵';
          maxHp = 180;
          shieldVal = 100;
          damage = 16;
        } else {
          enemyName = '力場護盾兵';
          maxHp = 140;
          shieldVal = 80;
          damage = 14;
        }
        speed = 2.8;
      } else if (type === 'sniper') {
        enemyName = '暗影狙擊機 (SHADOW SNIPER)';
        maxHp = 85;
        damage = 30;
        speed = 1.8;
      } else if (type === 'kamikaze') {
        enemyName = '自爆爬行蛛機 (KAMIKAZE DRONE)';
        maxHp = 60;
        damage = 36;
        speed = 5.2;
      } else if (type === 'stealth') {
        if (mission.environment === 'choice') {
          enemyName = '極秘暗殺型幽靈機';
          maxHp = 130;
          damage = 20;
        } else {
          enemyName = '光學迷彩幽靈機 (PHANTOM)';
          maxHp = 90;
          damage = 16;
        }
        speed = 4.6;
      } else if (type === 'support_medic') {
        enemyName = '奈米維修信標 (REPAIR BEACON)';
        maxHp = 110;
        damage = 8;
        speed = 3.0;
      } else if (type === 'assault') {
        enemyName = '突擊獵殺機';
        maxHp = 95;
        damage = 12;
        speed = 4.2;
      }

      allEnemiesData.push({
        id: `bot_${i}`,
        type,
        name: enemyName,
        x: ex,
        y: 0,
        z: ez,
        rotation: Math.random() * Math.PI * 2,
        maxHp,
        hp: maxHp,
        shield: shieldVal,
        maxShield: shieldVal,
        speed,
        state: 'patrol',
        attackCooldown: 1.5 + Math.random() * 1.5,
        damage,
      });
    }

    // Dynamic wave reinforcement queue: cap initial active arena enemies to prevent congestion
    const MAX_ACTIVE_ENEMIES = Math.min(12, totalCount);
    const reinforcementQueue: Enemy[] = [];

    // Ensure boss is in the active initial batch if present
    const bossIdx = allEnemiesData.findIndex((e) => e.type === 'titan_boss');
    if (bossIdx >= MAX_ACTIVE_ENEMIES) {
      const bossData = allEnemiesData.splice(bossIdx, 1)[0];
      allEnemiesData.unshift(bossData);
    }

    for (let i = 0; i < allEnemiesData.length; i++) {
      if (i < MAX_ACTIVE_ENEMIES) {
        const wrapper = createEnemyModel(allEnemiesData[i]);
        scene.add(wrapper.group);
        enemiesWrappers.push(wrapper);
      } else {
        reinforcementQueue.push(allEnemiesData[i]);
      }
    }

    // Function to warp in reinforcements dynamically as enemies are eliminated
    const spawnNextReinforcement = () => {
      if (reinforcementQueue.length === 0) return;
      const nextEnemyData = reinforcementQueue.shift()!;
      // Pick dynamic spawn position on perimeter
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = 18 + Math.random() * 8;
      nextEnemyData.x = camera.position.x + Math.sin(spawnAngle) * spawnDist;
      nextEnemyData.z = camera.position.z - Math.cos(spawnAngle) * spawnDist;

      const newWrapper = createEnemyModel(nextEnemyData);
      scene.add(newWrapper.group);
      enemiesWrappers.push(newWrapper);

      // Reinforcement warp light flash
      const warpLight = new THREE.PointLight(0x00f0ff, 4, 12);
      warpLight.position.set(nextEnemyData.x, 1.5, nextEnemyData.z);
      scene.add(warpLight);
      setTimeout(() => {
        scene.remove(warpLight);
        warpLight.dispose();
      }, 350);

      setEnemiesList(enemiesWrappers.map((w) => w.data));
    };

    setEnemiesList(enemiesWrappers.map((w) => w.data));

    // Pointer Lock & Mouse Look Controls
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== mount && document.pointerLockElement !== renderer.domElement) {
        return;
      }
      const zoomFactor = camera.fov / fov; // 1.0 at normal FOV, down to ~0.26 at 4x zoom
      const adsSensScale = stateRef.current.isAds ? Math.max(0.3, zoomFactor) : 1.0;
      const sens = mouseSensitivity * 0.0018 * adsSensScale;
      stateRef.current.mouse.yaw -= e.movementX * sens;
      stateRef.current.mouse.pitch -= e.movementY * sens;
      // Clamp pitch -85° to 85°
      stateRef.current.mouse.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, stateRef.current.mouse.pitch));
    };

    const onClickCanvas = () => {
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
      }
    };

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') k.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') k.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') k.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') k.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') k.sprint = true;
      if (e.code === 'ControlLeft' || e.code === 'KeyC') k.crouch = true;
      if (e.code === 'Space') {
        if (stateRef.current.onGround) {
          stateRef.current.velocity.y = 5.8;
          stateRef.current.onGround = false;
        }
      }
      if (e.code === 'KeyR') {
        startReload();
      }
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') switchWeapon(0);
      if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') switchWeapon(1);
      if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') switchWeapon(2);
      if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') switchWeapon(3);
      if (e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5') switchWeapon(4);
      if (e.code === 'Digit6' || e.code === 'Numpad6' || e.key === '6') switchWeapon(5);
      if (e.code === 'Escape') {
        setIsPaused((prev) => !prev);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') k.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') k.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') k.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') k.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') k.sprint = false;
      if (e.code === 'ControlLeft' || e.code === 'KeyC') k.crouch = false;
    };

    // Reload function
    const startReload = () => {
      const s = stateRef.current;
      const curW = s.currentWeapon;
      if (!s.isReloading && curW.currentMag < curW.baseStats.magSize && curW.totalReserve > 0) {
        s.isReloading = true;
        s.hadChamberedRoundOnReload = curW.currentMag > 0;
        s.reloadTimer = curW.baseStats.reloadTime;
        setIsReloading(true);
        sound.playReload();
      }
    };

    // Right-click ADS and Left-click Shoot / Auto Fire
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        // Right click ADS
        stateRef.current.isAds = true;
        setIsAds(true);
      } else if (e.button === 0) {
        const s = stateRef.current;
        const curW = s.currentWeapon;

        // Tactical Reload Cancel:
        // If reloading while bullets still remain, pressing left-click cancels reload
        // and leaves exactly 1 chambered round ready to fire (except for SG-4 Shotgun & Pulse-X Energy Weapon)
        if (s.isReloading) {
          const isShotgunOrEnergy =
            curW.id === 'SG-4' || curW.id === 'Pulse-X' || curW.category === '霰彈槍' || curW.category === '能量武器';
          if (s.hadChamberedRoundOnReload && !isShotgunOrEnergy) {
            s.isReloading = false;
            s.reloadTimer = 0;
            s.hadChamberedRoundOnReload = false;
            setIsReloading(false);
            setReloadProgress(0);
            curW.currentMag = 1;
            setCurrentWeapon({ ...curW });
            sound.playUiClick();
            s.isMouseDown = true;
            return;
          } else {
            // Cannot cancel reload for shotgun or energy weapon
            return;
          }
        }

        // Left click shoot / start full-auto burst
        stateRef.current.isMouseDown = true;
        triggerShoot();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        stateRef.current.isAds = false;
        setIsAds(false);
      } else if (e.button === 0) {
        stateRef.current.isMouseDown = false;
      }
    };

    const onBlur = () => {
      stateRef.current.isMouseDown = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Weapon Switching Helper
    const switchWeapon = (idx: number) => {
      if (idx < 0 || idx >= stateRef.current.weapons.length || !stateRef.current.weapons[idx].unlocked) return;
      stateRef.current.isReloading = false;
      stateRef.current.hadChamberedRoundOnReload = false;
      setIsReloading(false);
      setReloadProgress(0);
      stateRef.current.weaponIdx = idx;
      stateRef.current.currentWeapon = stateRef.current.weapons[idx];
      setCurrentWeapon(stateRef.current.weapons[idx]);
      onSelectWeapon(idx);

      // Re-create gun mesh
      gunContainer.remove(currentGunMesh);
      currentGunMesh = createProceduralWeaponModel(stateRef.current.weapons[idx], true);
      gunContainer.add(currentGunMesh);
      sound.playReload();
    };
    switchWeaponRef.current = switchWeapon;

    // Mouse wheel cycling across all 6 weapons
    const onWheel = (e: WheelEvent) => {
      const total = stateRef.current.weapons.length;
      if (total <= 1) return;
      let nextIdx = stateRef.current.weaponIdx;
      if (e.deltaY > 0) {
        nextIdx = (nextIdx + 1) % total;
      } else if (e.deltaY < 0) {
        nextIdx = (nextIdx - 1 + total) % total;
      }
      switchWeapon(nextIdx);
    };

    // Pre-allocated static Raycaster and screen vector to avoid GC pressure during rapid firing
    const sharedRaycaster = new THREE.Raycaster();
    const sharedScreenVec = new THREE.Vector2();

    // Shooting Mechanics & Raycasting
    const triggerShoot = () => {
      const now = performance.now();
      const s = stateRef.current;
      const curW = s.currentWeapon;

      // Check reload / ammo
      if (s.isReloading) {
        const isShotgunOrEnergy =
          curW.id === 'SG-4' || curW.id === 'Pulse-X' || curW.category === '霰彈槍' || curW.category === '能量武器';
        if (s.hadChamberedRoundOnReload && !isShotgunOrEnergy) {
          s.isReloading = false;
          s.reloadTimer = 0;
          s.hadChamberedRoundOnReload = false;
          setIsReloading(false);
          setReloadProgress(0);
          curW.currentMag = 1;
          setCurrentWeapon({ ...curW });
          sound.playUiClick();
        }
        return;
      }
      if (curW.currentMag <= 0) {
        if (curW.totalReserve > 0) {
          startReload(); // Auto-reload when attempting to fire with empty magazine
        } else {
          sound.playUiClick(); // empty chamber click when completely out of ammo
        }
        return;
      }

      // Fire rate throttle
      const fireIntervalMs = (60 / curW.baseStats.fireRate) * 1000;
      if (now - s.lastShotTime < fireIntervalMs) return;

      s.lastShotTime = now;
      curW.currentMag -= 1;
      s.shotsFired += 1;
      setCurrentWeapon({ ...curW });

      // Automatically trigger reload as soon as the last bullet is fired!
      if (curW.currentMag === 0 && curW.totalReserve > 0) {
        setTimeout(() => {
          startReload();
        }, 80);
      }

      // Audio
      sound.playGunshot(curW.id);

      // Recoil kick impulse
      const recoilMultiplier = (100 - curW.baseStats.stability) * 0.0003;
      s.recoilImpulse.z = 0.08;
      s.recoilImpulse.y = 0.03;
      s.mouse.pitch += (0.012 + recoilMultiplier) * (s.isAds ? 0.4 : 1.0);

      // Muzzle Flash
      muzzleLight.intensity = 3.5;
      setTimeout(() => {
        muzzleLight.intensity = 0;
      }, 50);

      // Ballistic Distance Falloff Multiplier Calculator
      const getDistanceDamageMultiplier = (weaponCategory: string, weaponId: string, distance: number): number => {
        if (weaponId === 'SG-4' || weaponCategory === '霰彈槍') {
          // 散彈槍極為明顯的距離衰減 (Prominent & Realistic Shotgun Kinetic Energy Dropoff):
          // 0m - 4m (貼臉零距離極致毀滅): 1.35x (~128+ 爆發傷害，近身一槍秒殺普通巡邏機)
          // 4m - 7m (極近戰 CQC): 1.00x -> 0.65x
          // 7m - 12m (近中距離急劇衰減): 0.65x -> 0.30x (衰減明顯，無法一擊致殘)
          // 12m - 18m (中距離散彈大面積離散): 0.30x -> 0.12x (傷害大幅縮水)
          // 18m - 26m (中遠距離破片動能喪失): 0.12x -> 0.05x (僅剩微弱刮痧)
          // > 26m (遠距離無效破片): 0.02x (最低微量保底 1~2 點傷害)
          if (distance <= 4) {
            return 1.35;
          } else if (distance <= 7) {
            const t = (distance - 4) / 3;
            return 1.35 - t * 0.70; // 1.35 -> 0.65
          } else if (distance <= 12) {
            const t = (distance - 7) / 5;
            return 0.65 - t * 0.35; // 0.65 -> 0.30
          } else if (distance <= 18) {
            const t = (distance - 12) / 6;
            return 0.30 - t * 0.18; // 0.30 -> 0.12
          } else if (distance <= 26) {
            const t = (distance - 18) / 8;
            return 0.12 - t * 0.07; // 0.12 -> 0.05
          } else {
            return Math.max(0.02, 0.05 - (distance - 26) * 0.003);
          }
        }

        // SR-12 狙擊槍全距離維持 100% 致命破甲威力
        if (weaponId === 'SR-12' || weaponCategory === '精準步槍') {
          return 1.0;
        }

        // P-01 手槍 15m 後輕微衰減
        if (weaponId === 'P-01' || weaponCategory === '手槍') {
          if (distance <= 14) return 1.0;
          return Math.max(0.35, 1.0 - ((distance - 14) / 22) * 0.65);
        }

        // AR-09, VX-7, Pulse-X 超遠距離(>32m)自然微量衰減
        if (distance <= 32) return 1.0;
        return Math.max(0.60, 1.0 - ((distance - 32) / 38) * 0.40);
      };

      const isShotgun = curW.id === 'SG-4' || curW.category === '霰彈槍';

      if (isShotgun) {
        // SG-4 散彈槍多破片噴射 (8 Pellets) 與明顯距離衰減模擬
        const pelletCount = 8;
        // 開鏡時喉縮收緊散佈範圍(0.022)，腰射時擴散至寬錐面(0.065)
        const spreadRadius = s.isAds ? 0.022 : 0.065;
        const basePelletDmg = curW.baseStats.damage / pelletCount;

        const enemyHits = new Map<EnemyMeshWrapper, { dmg: number; hasHeadshot: boolean; closestDist: number }>();
        const barrelHits = new Map<ExplosiveBarrel, { dmg: number; closestDist: number }>();

        for (let i = 0; i < pelletCount; i++) {
          let spreadX = 0;
          let spreadY = 0;
          if (i > 0) {
            const angle = (i / (pelletCount - 1)) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const r = Math.sqrt(Math.random()) * spreadRadius;
            spreadX = Math.cos(angle) * r;
            spreadY = Math.sin(angle) * r;
          }

          sharedScreenVec.set(spreadX, spreadY);
          sharedRaycaster.setFromCamera(sharedScreenVec, camera);

          type HitTarget =
            | { type: 'barrel'; barrel: ExplosiveBarrel; dist: number }
            | { type: 'enemy'; ew: EnemyMeshWrapper; dist: number; isHeadshot: boolean };
          const candidateHits: HitTarget[] = [];

          for (const b of explosiveBarrels) {
            if (b.exploded) continue;
            const intersects = sharedRaycaster.intersectObject(b.mesh, true);
            if (intersects.length > 0) {
              candidateHits.push({ type: 'barrel', barrel: b, dist: intersects[0].distance });
            }
          }

          for (const ew of enemiesWrappers) {
            if (ew.data.hp <= 0) continue;
            const intersects = sharedRaycaster.intersectObject(ew.group, true);
            if (intersects.length > 0) {
              const isHeadshot = intersects[0].object === ew.headMesh;
              candidateHits.push({ type: 'enemy', ew, dist: intersects[0].distance, isHeadshot });
            }
          }

          if (candidateHits.length > 0) {
            candidateHits.sort((a, b) => a.dist - b.dist);
            const nearest = candidateHits[0];
            const distMultiplier = getDistanceDamageMultiplier(curW.category, curW.id, nearest.dist);

            if (nearest.type === 'barrel') {
              const dmg = basePelletDmg * distMultiplier;
              const prev = barrelHits.get(nearest.barrel) || { dmg: 0, closestDist: nearest.dist };
              barrelHits.set(nearest.barrel, { dmg: prev.dmg + dmg, closestDist: Math.min(prev.closestDist, nearest.dist) });
            } else {
              const dmg = basePelletDmg * distMultiplier * (nearest.isHeadshot ? 1.8 : 1.0);
              const prev = enemyHits.get(nearest.ew) || { dmg: 0, hasHeadshot: false, closestDist: nearest.dist };
              enemyHits.set(nearest.ew, {
                dmg: prev.dmg + dmg,
                hasHeadshot: prev.hasHeadshot || nearest.isHeadshot,
                closestDist: Math.min(prev.closestDist, nearest.dist),
              });
            }
          }
        }

        let totalShotDmg = 0;
        let anyHeadshot = false;

        // 結算油桶破片傷害
        barrelHits.forEach((bData, b) => {
          b.hp -= bData.dmg;
          if (b.hp <= 0 && !b.exploded) {
            b.exploded = true;
            sound.playExplosion();
            b.mesh.visible = false;
            enemiesWrappers.forEach((ew) => {
              const d = ew.group.position.distanceTo(b.mesh.position);
              if (d < 8) {
                damageEnemy(ew, 120, false, false);
              }
            });
          }
        });

        // 結算敵人破片傷害
        enemyHits.forEach((eData, ew) => {
          const finalEnemyDmg = Math.max(1, Math.round(eData.dmg));
          totalShotDmg += finalEnemyDmg;
          if (eData.hasHeadshot) anyHeadshot = true;
          damageEnemy(ew, finalEnemyDmg, eData.hasHeadshot, false);
        });

        if (totalShotDmg > 0 || barrelHits.size > 0) {
          s.shotsHit += 1;
          sound.playHitMarker(anyHeadshot);
          setHitMarker({
            visible: true,
            isHeadshot: anyHeadshot,
            damage: totalShotDmg > 0 ? totalShotDmg : Math.round(curW.baseStats.damage * 0.8),
          });
          setTimeout(() => setHitMarker(null), 320);
        }
      } else {
        // 標準單發直射武器 (突擊步槍、衝鋒槍、狙擊步槍、手槍、能量武器)
        sharedScreenVec.set(0, 0);
        sharedRaycaster.setFromCamera(sharedScreenVec, camera);

        // Check explosive barrels first
        let barrelHit = false;
        for (const b of explosiveBarrels) {
          if (b.exploded) continue;
          const intersects = sharedRaycaster.intersectObject(b.mesh, true);
          if (intersects.length > 0) {
            const hitDist = intersects[0].distance;
            const distMultiplier = getDistanceDamageMultiplier(curW.category, curW.id, hitDist);
            const appliedDmg = Math.round(curW.baseStats.damage * distMultiplier);
            b.hp -= appliedDmg;
            sound.playHitMarker(false);
            s.shotsHit += 1;
            barrelHit = true;
            if (b.hp <= 0) {
              b.exploded = true;
              sound.playExplosion();
              b.mesh.visible = false;
              enemiesWrappers.forEach((ew) => {
                const d = ew.group.position.distanceTo(b.mesh.position);
                if (d < 8) {
                  damageEnemy(ew, 120, false, false);
                }
              });
            }
            break;
          }
        }

        // Check Enemy bots if no barrel intercepted
        if (!barrelHit) {
          for (const ew of enemiesWrappers) {
            if (ew.data.hp <= 0) continue;
            const intersects = sharedRaycaster.intersectObject(ew.group, true);
            if (intersects.length > 0) {
              s.shotsHit += 1;
              const hitObj = intersects[0].object;
              const isHeadshot = hitObj === ew.headMesh;
              const hitDist = intersects[0].distance;
              const distMultiplier = getDistanceDamageMultiplier(curW.category, curW.id, hitDist);
              const damage = Math.max(1, Math.round(curW.baseStats.damage * distMultiplier * (isHeadshot ? 2.5 : 1.0)));

              damageEnemy(ew, damage, isHeadshot, true);
              break;
            }
          }
        }
      }
    };

    // Enemy Damage Calculation
    const damageEnemy = (ew: EnemyMeshWrapper, dmg: number, isHeadshot: boolean, triggerMarker: boolean = true) => {
      if (triggerMarker) {
        sound.playHitMarker(isHeadshot);
        setHitMarker({ visible: true, isHeadshot, damage: dmg });
        setTimeout(() => setHitMarker(null), 300);
      }

      ew.hitFlashTimer = 0.15;

      // Handle Shield first if enemy has shield
      if (ew.data.shield && ew.data.shield > 0) {
        ew.data.shield = Math.max(0, ew.data.shield - dmg);
        if (ew.data.shield <= 0 && ew.shieldMesh) {
          ew.shieldMesh.visible = false;
        }
      } else {
        ew.data.hp -= dmg;
      }

      // Update 3D health bar
      const hpRatio = Math.max(0, ew.data.hp / ew.data.maxHp);
      if (ew.healthBarFill) {
        ew.healthBarFill.scale.x = hpRatio;
      }

      // Alert nearby state
      ew.data.state = 'attack';

      // Check Kill
      if (ew.data.hp <= 0) {
        ew.data.hp = 0;
        ew.data.state = 'dead';
        sound.playExplosion();
        ew.group.visible = false;

        stateRef.current.enemiesKilled += 1;
        setEnemiesKilled(stateRef.current.enemiesKilled);

        // Warp in next reinforcement from queue if available
        spawnNextReinforcement();

        // Radio comms trigger at 50%
        if (stateRef.current.enemiesKilled === Math.floor(stateRef.current.totalEnemies / 2)) {
          sound.playRadioBeep();
          setCurrentComms({
            id: 'halfway',
            sender: 'Aira',
            senderTitle: '情報通訊官',
            message: '幹得好凱恩！敵方防線已經崩潰一半，維持節奏！',
            durationMs: 3800,
          });
          setTimeout(() => setCurrentComms(null), 3800);
        }

        // Check Victory
        if (stateRef.current.enemiesKilled >= stateRef.current.totalEnemies) {
          handleVictory();
        }
      }

      setEnemiesList([...enemiesWrappers.map((w) => w.data)]);
    };

    // Victory Handler
    const handleVictory = () => {
      stateRef.current.isMissionComplete = true;
      setIsMissionComplete(true);
      document.exitPointerLock?.();

      sound.playRadioBeep();
      setCurrentComms({
        id: 'mission_complete',
        sender: 'Aira',
        senderTitle: '情報通訊官',
        message: '區域已完全肅清！目標數據成功回收，準備進行戰術結算。',
        durationMs: 4000,
      });

      const timeSec = Math.round((Date.now() - stateRef.current.startTime) / 1000);
      setMissionStats({
        timeSeconds: timeSec,
        shotsFired: stateRef.current.shotsFired,
        shotsHit: stateRef.current.shotsHit,
        enemiesKilled: stateRef.current.enemiesKilled,
        totalEnemies: stateRef.current.totalEnemies,
        secondaryCompleted: stateRef.current.playerStats.shield > 20,
      });

      onMissionFinished(mission.rewards);
    };

    // Attach DOM Listeners
    renderer.domElement.addEventListener('click', onClickCanvas);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('wheel', onWheel, { passive: true });

    // Clock and Animation Frame
    const clock = new THREE.Clock();
    let frameId: number;

    // Pre-allocated reusable scratch math objects for zero GC garbage creation in 60-144 FPS game loop
    const _forward = new THREE.Vector3();
    const _right = new THREE.Vector3();
    const _moveDir = new THREE.Vector3();
    const _lookPos = new THREE.Vector3();
    const _dir = new THREE.Vector3();
    const _backDir = new THREE.Vector3();
    const _muzzlePos = new THREE.Vector3();
    const _gunTarget = new THREE.Vector3();
    const _localTarget = new THREE.Vector3();
    const _axisY = new THREE.Vector3(0, 1, 0);

    const adsTargetPos = new THREE.Vector3(0, -0.1, -0.28);
    const sniperAdsTargetPos = new THREE.Vector3(0, -0.38, -0.32);
    const hipTargetPos = new THREE.Vector3(0.18, -0.18, -0.42);

    let hudSyncTimer = 0;

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const nowTime = clock.getElapsedTime();
      const s = stateRef.current;

      // Mission Tactical Countdown Timer
      if (!s.isPaused && !s.isGameOver && !s.isMissionComplete) {
        s.timeRemaining -= delta;
        if (s.timeRemaining <= 0) {
          s.timeRemaining = 0;
          s.isGameOver = true;
          setGameOverReason('timeout');
          setIsGameOver(true);
          sound.playPlayerHurt(true);
          document.exitPointerLock?.();
        }
      }

      // Handle Full-Auto Continuous Fire when mouse held down
      if (s.isMouseDown && !s.isPaused && !s.isGameOver && !s.isMissionComplete) {
        if (s.currentWeapon.fireMode === 'auto') {
          triggerShoot();
        }
      }

      // 1. Rotate giant orbital sky ring
      if (ringObject) {
        ringObject.rotation.z += 0.05 * delta;
      }

      // 2. Animate Rain Particles
      if (rainParticles) {
        const pos = rainParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] -= 28 * delta;
          if (pos[i] < 0) pos[i] = 35;
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
      }

      // 3. Handle Reloading Timer
      if (s.isReloading) {
        s.reloadTimer -= delta;
        if (s.reloadTimer <= 0) {
          s.isReloading = false;
          setIsReloading(false);
          setReloadProgress(0);
          // Refill Mag
          const needed = s.currentWeapon.baseStats.magSize - s.currentWeapon.currentMag;
          const transfer = Math.min(needed, s.currentWeapon.totalReserve);
          s.currentWeapon.currentMag += transfer;
          s.currentWeapon.totalReserve -= transfer;
          setCurrentWeapon({ ...s.currentWeapon });
        }
      }

      // 4. Handle Shield Regeneration
      if (s.shieldRegenCooldown > 0) {
        s.shieldRegenCooldown -= delta;
      } else if (s.playerStats.shield < s.playerStats.maxShield) {
        s.playerStats.shield = Math.min(s.playerStats.maxShield, s.playerStats.shield + 15 * delta);
      }

      // 5. Update Camera Orientation (Yaw & Pitch)
      camera.rotation.order = 'YXZ';
      camera.rotation.y = s.mouse.yaw;
      camera.rotation.x = s.mouse.pitch;

      // 6. Player Movement & Physics
      const isSprinting = s.keys.sprint && s.playerStats.stamina > 5 && s.keys.forward;
      const moveSpeed = (isSprinting ? 12 : s.keys.crouch ? 4.5 : 7.5) * delta;

      // Stamina drain/recovery
      if (isSprinting) {
        s.playerStats.stamina = Math.max(0, s.playerStats.stamina - 20 * delta);
      } else {
        s.playerStats.stamina = Math.min(s.playerStats.maxStamina, s.playerStats.stamina + 15 * delta);
      }

      _forward.set(0, 0, -1).applyAxisAngle(_axisY, s.mouse.yaw);
      _right.set(1, 0, 0).applyAxisAngle(_axisY, s.mouse.yaw);

      _moveDir.set(0, 0, 0);
      if (s.keys.forward) _moveDir.add(_forward);
      if (s.keys.backward) _moveDir.sub(_forward);
      if (s.keys.right) _moveDir.add(_right);
      if (s.keys.left) _moveDir.sub(_right);

      if (_moveDir.lengthSq() > 0) {
        _moveDir.normalize();
        const newX = camera.position.x + _moveDir.x * moveSpeed;
        const newZ = camera.position.z + _moveDir.z * moveSpeed;

        // Collision check against barriers & crates
        let collide = false;
        const playerRadius = 0.5;
        for (const obs of obstacles) {
          if (
            newX + playerRadius > obs.box.min.x &&
            newX - playerRadius < obs.box.max.x &&
            newZ + playerRadius > obs.box.min.z &&
            newZ - playerRadius < obs.box.max.z
          ) {
            collide = true;
            break;
          }
        }

        if (!collide) {
          camera.position.x = newX;
          camera.position.z = newZ;
        }

        // Footstep audio pacing
        if (Math.random() < 0.05 * (isSprinting ? 1.5 : 1)) {
          sound.playFootstep();
        }
      }

      // Vertical Gravity & Jump
      const targetEyeHeight = s.keys.crouch ? 1.0 : 1.7;
      s.velocity.y -= 18 * delta;
      camera.position.y += s.velocity.y * delta;
      if (camera.position.y <= targetEyeHeight) {
        camera.position.y = targetEyeHeight;
        s.velocity.y = 0;
        s.onGround = true;
      }

      // Throttled UI State Synchronization (25 Hz - saves ~70% React render overhead for buttery smooth gameplay)
      hudSyncTimer += delta;
      if (hudSyncTimer >= 0.04) {
        hudSyncTimer = 0;
        setPlayerPos({
          x: camera.position.x,
          z: camera.position.z,
          angle: s.mouse.yaw,
        });

        if (s.isReloading) {
          const totalTime = s.currentWeapon.baseStats.reloadTime;
          setReloadProgress(Math.max(0, Math.min(1, 1 - s.reloadTimer / totalTime)));
        }

        if (s.playerStats.shield < s.playerStats.maxShield || s.playerStats.stamina < s.playerStats.maxStamina) {
          setHudStats({ ...s.playerStats });
        }

        setTimeRemaining(Math.max(0, Math.ceil(s.timeRemaining)));
      }

      // 7. Dynamic Optical Zoom FOV & Sight Alignment
      const scopeType = s.currentWeapon.attachments.scope || (s.currentWeapon.id === 'SR-12' ? 'scope_sniper_4x' : 'scope_holo');
      let targetFov = fov;
      if (s.isAds) {
        if (scopeType === 'scope_sniper_4x' || s.currentWeapon.id === 'SR-12') {
          targetFov = fov / 3.8; // ~20 deg: Full 4x tactical sniper scope magnification
        } else if (scopeType === 'scope_holo') {
          targetFov = fov / 1.45; // ~52 deg: 1.45x holographic sight magnification
        } else if (scopeType === 'scope_reflex') {
          targetFov = fov / 1.4; // ~53.5 deg: 1.4x red dot reflex sight magnification
        } else {
          targetFov = fov / 1.2; // ~62.5 deg: 1.2x iron sight eye focus
        }
      }

      // Smoothly interpolate camera FOV for realistic optical zoom transition
      const curFov = camera.fov;
      const nextFov = THREE.MathUtils.damp(curFov, targetFov, 14, delta);
      if (Math.abs(nextFov - curFov) > 0.05) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }

      // Sight alignment position based on scope type and weapon
      const isSniperScope = scopeType === 'scope_sniper_4x' || s.currentWeapon.id === 'SR-12';
      let adsTargetY = -0.10;
      if (s.currentWeapon.id === 'VX-7' || s.currentWeapon.id === 'SG-4' || s.currentWeapon.id === 'Pulse-X') {
        adsTargetY = -0.09;
      } else if (s.currentWeapon.id === 'P-01') {
        adsTargetY = -0.075;
      }
      adsTargetPos.set(0, adsTargetY, -0.28);

      const activeTargetPos = s.isAds ? (isSniperScope ? sniperAdsTargetPos : adsTargetPos) : hipTargetPos;

      // Breathing bob (much steadier when aiming down sights)
      const bobY = Math.sin(nowTime * 3) * (s.isAds ? 0.0006 : 0.005);
      const bobX = Math.cos(nowTime * 1.5) * (s.isAds ? 0.0006 : 0.004);

      // Recoil recovery
      s.recoilImpulse.z = THREE.MathUtils.damp(s.recoilImpulse.z, 0, 15, delta);
      s.recoilImpulse.y = THREE.MathUtils.damp(s.recoilImpulse.y, 0, 15, delta);

      // Update 3D optic attachment visibility:
      const opticMesh = currentGunMesh.getObjectByName('optic_attachment');
      if (opticMesh) {
        opticMesh.visible = !(s.isAds && !isSniperScope);
      }

      _gunTarget.set(
        activeTargetPos.x + bobX,
        activeTargetPos.y + bobY + s.recoilImpulse.y,
        activeTargetPos.z + s.recoilImpulse.z
      );
      gunContainer.position.lerp(_gunTarget, 14 * delta);

      // 8. Enemy AI Update Loop
      enemiesWrappers.forEach((ew) => {
        if (ew.data.hp <= 0) return;

        // Make floating health bar billboard face camera
        if (ew.healthBarObj) {
          ew.healthBarObj.quaternion.copy(camera.quaternion);
        }

        const distToPlayer = ew.group.position.distanceTo(camera.position);

        // Turn towards player if alerted or within combat radius
        if (distToPlayer < 45) {
          ew.data.state = 'attack';
          _lookPos.set(camera.position.x, ew.group.position.y, camera.position.z);
          ew.group.lookAt(_lookPos);

          // -------------------------------------------------------------
          // Archetype: KAMIKAZE (自爆爬行蛛機)
          // -------------------------------------------------------------
          if (ew.data.type === 'kamikaze') {
            if (ew.kamikazeCore) {
              const pulse = 1 + Math.sin(nowTime * 14) * 0.18;
              ew.kamikazeCore.scale.setScalar(pulse);
            }

            // Rapid sprint directly at player
            _dir.subVectors(camera.position, ew.group.position).normalize();
            ew.group.position.addScaledVector(_dir, ew.data.speed * delta);
            ew.data.x = ew.group.position.x;
            ew.data.z = ew.group.position.z;

            // Suicide Detonation within close proximity
            if (distToPlayer <= 2.6) {
              ew.data.hp = 0;
              ew.data.state = 'dead';
              ew.group.visible = false;
              sound.playExplosion();

              // Player blast damage
              sound.playPlayerHurt(s.playerStats.shield <= 0);
              setHurtFlash(true);
              setTimeout(() => setHurtFlash(false), 250);
              s.shieldRegenCooldown = 4.5;
              if (s.playerStats.shield > 0) {
                s.playerStats.shield = Math.max(0, s.playerStats.shield - ew.data.damage);
              } else {
                s.playerStats.hp = Math.max(0, s.playerStats.hp - ew.data.damage);
                if (s.playerStats.hp <= 0) {
                  s.isGameOver = true;
                  setIsGameOver(true);
                  document.exitPointerLock?.();
                }
              }
              setHudStats({ ...s.playerStats });

              // Chain detonation on nearby barrels
              explosiveBarrels.forEach((b) => {
                if (!b.exploded && b.mesh.position.distanceTo(ew.group.position) < 7) {
                  b.hp = 0;
                  b.exploded = true;
                  b.mesh.visible = false;
                  sound.playExplosion();
                }
              });

              stateRef.current.enemiesKilled += 1;
              setEnemiesKilled(stateRef.current.enemiesKilled);
              spawnNextReinforcement();
              if (stateRef.current.enemiesKilled >= stateRef.current.totalEnemies) {
                handleVictory();
              }
              setEnemiesList([...enemiesWrappers.map((w) => w.data)]);
              return;
            }
          }
          // -------------------------------------------------------------
          // Archetype: SNIPER (暗影狙擊機)
          // -------------------------------------------------------------
          else if (ew.data.type === 'sniper') {
            // Sniper maintains vantage distance, repositioning if player gets too close
            if (distToPlayer < 12) {
              _backDir.subVectors(ew.group.position, camera.position).normalize();
              ew.group.position.addScaledVector(_backDir, ew.data.speed * delta);
              ew.data.x = ew.group.position.x;
              ew.data.z = ew.group.position.z;
            }

            // Real-time red targeting laser pointing directly at the player
            if (ew.sniperLaserLine) {
              _localTarget.copy(camera.position);
              _localTarget.y -= 0.1;
              ew.group.worldToLocal(_localTarget);
              const posAttr = ew.sniperLaserLine.geometry.attributes.position;
              posAttr.setXYZ(1, _localTarget.x, _localTarget.y, _localTarget.z);
              posAttr.needsUpdate = true;
              ew.sniperLaserLine.visible = distToPlayer < 45;
            }

            // High-power Railgun Sniper shot
            ew.data.attackCooldown -= delta;
            if (ew.data.attackCooldown <= 0) {
              ew.data.attackCooldown = 2.8 + Math.random() * 0.8;
              _muzzlePos.copy(ew.group.position);
              _muzzlePos.y += 1.45;
              const bullet = createLaserBullet(_muzzlePos, camera.position, ew.data.damage, 0xff0044, 52);
              scene.add(bullet.mesh);
              laserBullets.push(bullet);
              sound.playGunshot('SR-12');
            }
          }
          // -------------------------------------------------------------
          // Archetype: SUPPORT MEDIC (奈米維修信標機)
          // -------------------------------------------------------------
          else if (ew.data.type === 'support_medic') {
            if (ew.medicRotor) {
              ew.medicRotor.rotation.y += 3.5 * delta;
            }
            ew.group.position.y = 0.2 + Math.sin(nowTime * 2.5 + ew.group.id * 0.5) * 0.15;

            // Hover and orbit behind friendly bots, keeping distance from player
            if (distToPlayer > 14) {
              _dir.subVectors(camera.position, ew.group.position).normalize();
              ew.group.position.addScaledVector(_dir, ew.data.speed * delta);
              ew.data.x = ew.group.position.x;
              ew.data.z = ew.group.position.z;
            }

            // Nanite Healing Pulse on wounded teammates
            ew.data.attackCooldown -= delta;
            if (ew.data.attackCooldown <= 0) {
              ew.data.attackCooldown = 2.0;
              const wounded = enemiesWrappers.find(
                (other) =>
                  other !== ew &&
                  other.data.hp > 0 &&
                  other.data.hp < other.data.maxHp &&
                  other.group.position.distanceTo(ew.group.position) < 16
              );
              if (wounded) {
                wounded.data.hp = Math.min(wounded.data.maxHp, wounded.data.hp + 28);
                if (wounded.healthBarFill) {
                  wounded.healthBarFill.scale.x = Math.max(0, wounded.data.hp / wounded.data.maxHp);
                }
                sound.playShieldHit();
              }
            }
          }
          // -------------------------------------------------------------
          // Archetype: STEALTH (光學迷彩幽靈機)
          // -------------------------------------------------------------
          else if (ew.data.type === 'stealth') {
            // Optical camouflage opacity shifting: nearly invisible when far, reveals when close or taking hits
            if (ew.stealthMaterials && ew.stealthMaterials.length > 0) {
              const isRevealed = distToPlayer < 7.5 || ew.hitFlashTimer > 0;
              const targetOpacity = isRevealed ? 0.8 : 0.22;
              ew.stealthMaterials.forEach((m) => {
                m.opacity = THREE.MathUtils.damp(m.opacity, targetOpacity, 8, delta);
              });
            }

            // High speed flanking movement
            if (distToPlayer > 4.5) {
              _dir.subVectors(camera.position, ew.group.position).normalize();
              ew.group.position.addScaledVector(_dir, ew.data.speed * delta);
              ew.data.x = ew.group.position.x;
              ew.data.z = ew.group.position.z;
            }

            // Plasma Blade Slash / Dual Bolt attack
            ew.data.attackCooldown -= delta;
            if (ew.data.attackCooldown <= 0) {
              ew.data.attackCooldown = 1.3 + Math.random() * 0.4;
              _muzzlePos.copy(ew.group.position);
              _muzzlePos.y += 1.1;
              const bullet = createLaserBullet(_muzzlePos, camera.position, ew.data.damage, 0xaa22ff, 42);
              scene.add(bullet.mesh);
              laserBullets.push(bullet);
              sound.playGunshot('Pulse-X');
            }
          }
          // -------------------------------------------------------------
          // Archetypes: ASSAULT, SHIELD, HEAVY, TITAN BOSS, PATROL
          // -------------------------------------------------------------
          else {
            const minHoldDist = ew.data.type === 'titan_boss' ? 10 : ew.data.type === 'heavy' ? 7 : 8;
            if (distToPlayer > minHoldDist) {
              _dir.subVectors(camera.position, ew.group.position).normalize();
              ew.group.position.addScaledVector(_dir, ew.data.speed * delta);
              ew.data.x = ew.group.position.x;
              ew.data.z = ew.group.position.z;
            }

            // Attack cooldown & fire laser
            ew.data.attackCooldown -= delta;
            if (ew.data.attackCooldown <= 0) {
              ew.data.attackCooldown = ew.data.type === 'titan_boss' ? 0.75 : 1.8 + Math.random() * 0.5;
              _muzzlePos.copy(ew.group.position);
              _muzzlePos.y += 1.3;
              const bullet = createLaserBullet(
                _muzzlePos,
                camera.position,
                ew.data.damage,
                ew.data.type === 'titan_boss' ? 0xff0044 : 0xff1e00
              );
              scene.add(bullet.mesh);
              laserBullets.push(bullet);
              sound.playGunshot('Pulse-X');
            }
          }
        }
      });

      // 9. Update Enemy Laser Projectiles
      for (let i = laserBullets.length - 1; i >= 0; i--) {
        const b = laserBullets[i];
        const step = b.speed * delta;
        b.mesh.position.addScaledVector(b.direction, step);
        b.distanceTraveled += step;

        // Check Hit on Player
        if (b.mesh.position.distanceTo(camera.position) < 1.2) {
          // Player hit!
          sound.playPlayerHurt(s.playerStats.shield <= 0);
          setHurtFlash(true);
          setTimeout(() => setHurtFlash(false), 200);

          s.shieldRegenCooldown = 4.0; // Reset shield regen timer

          if (s.playerStats.shield > 0) {
            s.playerStats.shield = Math.max(0, s.playerStats.shield - b.damage);
          } else {
            s.playerStats.hp = Math.max(0, s.playerStats.hp - b.damage);
            if (s.playerStats.hp <= 0) {
              s.isGameOver = true;
              setGameOverReason('hp_zero');
              setIsGameOver(true);
              document.exitPointerLock?.();
            }
          }
          setHudStats({ ...s.playerStats });

          scene.remove(b.mesh);
          laserBullets.splice(i, 1);
          continue;
        }

        // Max range remove
        if (b.distanceTraveled >= b.maxDistance) {
          scene.remove(b.mesh);
          laserBullets.splice(i, 1);
        }
      }

      // Render Scene
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClickCanvas);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      document.exitPointerLock?.();
      renderer.dispose();
      if (mount && renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [mission, mouseSensitivity, fov, combatSessionKey]);

  // In-memory seamless mission restart (restores HP, shields, weapons, and respawns wave without browser reload)
  const handleRestartCombat = () => {
    sound.playUiClick();
    setIsGameOver(false);
    setIsMissionComplete(false);
    setIsPaused(false);
    setGameOverReason('hp_zero');
    setTimeRemaining(MISSION_TIME_LIMIT);
    setEnemiesKilled(0);
    const resetStats: PlayerStats = {
      ...playerStats,
      hp: playerStats.maxHp,
      shield: playerStats.maxShield,
      stamina: playerStats.maxStamina,
    };
    setHudStats(resetStats);
    onUpdateStats(resetStats);
    stateRef.current.playerStats = { ...resetStats };
    stateRef.current.enemiesKilled = 0;
    stateRef.current.shotsFired = 0;
    stateRef.current.shotsHit = 0;
    stateRef.current.isGameOver = false;
    stateRef.current.isMissionComplete = false;
    stateRef.current.isPaused = false;
    stateRef.current.timeRemaining = MISSION_TIME_LIMIT;
    setCombatSessionKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* Tactical Sci-Fi HUD */}
      <HUD
        playerStats={hudStats}
        currentWeapon={currentWeapon}
        allWeapons={weapons}
        mission={mission}
        enemies={enemiesList}
        enemiesKilled={enemiesKilled}
        totalEnemies={mission.targetCount}
        timeRemaining={timeRemaining}
        playerPos={playerPos}
        isAds={isAds}
        isReloading={isReloading}
        reloadProgress={reloadProgress}
        hitMarker={hitMarker}
        hurtFlash={hurtFlash}
        onSelectWeapon={(idx) => switchWeaponRef.current(idx)}
        onTogglePause={() => setIsPaused((prev) => !prev)}
      />

      {/* Live Radio Comms Dialog */}
      <CommsDialog message={currentComms} />

      {/* Pointer Lock Help Banner when mouse unlocked */}
      {!isPaused && !isMissionComplete && !isGameOver && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="px-3 py-1 rounded bg-slate-950/70 border border-cyan-400/30 text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
            點擊畫面鎖定視角 // CLICK TO LOCK AIM
          </div>
        </div>
      )}

      {/* Mission Debriefing Victory Modal */}
      {isMissionComplete && (
        <MissionCompleteModal
          mission={mission}
          stats={missionStats}
          onRestartMission={handleRestartCombat}
          onNextMission={() => {
            setIsMissionComplete(false);
            if (onNextMission) {
              onNextMission();
            } else {
              onBackToMenu();
            }
          }}
          onReturnToArmory={() => {
            setIsMissionComplete(false);
            onOpenArmory();
          }}
        />
      )}

      {/* Game Over Defeat Screen (勝敗畫面 - 失敗) */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-red-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="sci-box max-w-md w-full p-6 text-center border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)]">
            <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/60 rounded text-[11px] font-orbitron font-bold text-red-400 mb-3 tracking-widest">
              MISSION FAILED // 作戰失敗
            </div>
            <h2 className="font-orbitron font-black text-3xl text-red-400 mb-2 tracking-wide drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
              {gameOverReason === 'timeout' ? '作戰時間耗盡 (TIME OUT)' : '裝甲生命歸零 (HP: 0)'}
            </h2>
            <div className="p-3.5 my-4 rounded bg-red-950/50 border border-red-500/40 text-xs text-slate-300 font-sans space-y-2 text-left">
              <p className="font-semibold text-red-200">
                {gameOverReason === 'timeout'
                  ? '作戰倒數已歸零 (00:00)！未能在限定時間內肅清所有敵機，敵方主力部隊已完成區域封鎖。'
                  : '外骨骼裝甲生命值歸零！凱恩受到致命破壞，神經連結緊急中斷並進入防禦休眠。'}
              </p>
              <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-red-500/30 font-mono">
                <span>關卡：{mission.title}</span>
                <span className="text-red-300 font-bold">殲敵數：{enemiesKilled} / {mission.targetCount} 機</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  sound.playUiClick();
                  onBackToMenu();
                }}
                className="flex-1 py-2.5 sci-btn bg-slate-900 hover:bg-slate-800 border border-red-500/40 text-slate-300 text-xs font-orbitron cursor-pointer transition-all"
              >
                返回首頁 (MENU)
              </button>
              <button
                onClick={handleRestartCombat}
                className="flex-1 py-2.5 sci-btn bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.7)] transition-all"
              >
                <RotateCcw className="w-4 h-4" /> 重新開始 (RETRY)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sci-box max-w-sm w-full p-6 text-center border-cyan-400 shadow-[0_0_40px_rgba(0,210,255,0.3)]">
            <h2 className="font-orbitron font-bold text-xl text-cyan-200 mb-4">
              作戰暫停 (TACTICAL PAUSE)
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setIsPaused(false);
                }}
                className="w-full py-2.5 sci-btn bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs tracking-wider cursor-pointer shadow-[0_0_15px_#00f0ff]"
              >
                繼續作戰 (RESUME)
              </button>
              <button
                onClick={handleRestartCombat}
                className="w-full py-2.5 sci-btn bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 重新開始本關 (RETRY)
              </button>
              <button
                onClick={() => {
                  sound.playUiClick();
                  onOpenArmory();
                }}
                className="w-full py-2.5 sci-btn bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs cursor-pointer"
              >
                檢視武器裝備
              </button>
              <button
                onClick={() => {
                  sound.playUiClick();
                  onBackToMenu();
                }}
                className="w-full py-2.5 sci-btn bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-orbitron text-xs cursor-pointer"
              >
                放棄任務返回主選單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type WeaponType = 'AR-09' | 'VX-7' | 'SR-12' | 'SG-4' | 'Pulse-X' | 'P-01';

export type WeaponCategory = '突擊步槍' | '衝鋒槍' | '精準步槍' | '霰彈槍' | '能量武器' | '手槍';

export interface WeaponStats {
  damage: number;       // 10 - 150
  fireRate: number;     // rounds per minute or relative scale 1-100
  stability: number;    // 1-100 (lower recoil)
  range: number;        // effective distance
  magSize: number;
  reloadTime: number;   // seconds
}

export interface Attachment {
  id: string;
  name: string;
  type: 'scope' | 'grip' | 'muzzle' | 'magazine';
  statModifiers: Partial<WeaponStats>;
  description: string;
  unlocked: boolean;
  cost: number;
}

export interface WeaponSkin {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  unlocked: boolean;
}

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  category: WeaponCategory;
  description: string;
  baseStats: WeaponStats;
  currentLevel: number;
  maxLevel: number;
  unlocked: boolean;
  unlockCost: number;
  upgradeCost: number;
  currentMag: number;
  totalReserve: number;
  maxReserve: number;
  attachments: {
    scope?: string;
    grip?: string;
    muzzle?: string;
    magazine?: string;
  };
  selectedSkin: string;
  fireMode: 'auto' | 'semi' | 'burst';
}

export interface Enemy {
  id: string;
  type:
    | 'patrol'
    | 'assault'
    | 'shield'
    | 'heavy'
    | 'sniper'
    | 'kamikaze'
    | 'stealth'
    | 'support_medic'
    | 'titan_boss';
  name: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  maxHp: number;
  hp: number;
  shield?: number;
  maxShield?: number;
  speed: number;
  state: 'patrol' | 'alert' | 'attack' | 'dead';
  attackCooldown: number;
  damage: number;
  patrolPoints?: [number, number][];
  currentPatrolIdx?: number;
}

export type MissionEnvironment =
  | 'industrial'
  | 'lab'
  | 'city'
  | 'orbital'
  | 'reactor'
  | 'mech_factory'
  | 'core'
  | 'abyss'
  | 'choice';

export interface MissionChapter {
  id: number;
  title: string;
  subTitle: string;
  environment: MissionEnvironment;
  description: string;
  mainObjective: string;
  targetCount: number;
  secondaryObjective: string;
  dangerLevel?: number;
  rewards: {
    exp: number;
    credits: number;
    materials: number;
  };
  briefing: string[];
  enemyComposition: {
    patrol?: number;
    assault?: number;
    shield?: number;
    heavy?: number;
    sniper?: number;
    kamikaze?: number;
    stealth?: number;
    support_medic?: number;
    boss?: boolean;
  };
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  stamina: number;
  maxStamina: number;
  exp: number;
  nextLevelExp: number;
  level: number;
  credits: number;
  gears: number;
}

export interface GameSettings {
  mouseSensitivity: number;
  invertY: boolean;
  volumeMaster: number;
  volumeBgm: number;
  volumeSfx: number;
  fov: number;
  crosshairColor: string;
  showFps: boolean;
  adsToggle: boolean;
}

export interface RadioCommsMessage {
  id: string;
  sender: 'Aira' | 'Kane' | 'Commander' | 'System';
  senderTitle: string;
  message: string;
  durationMs: number;
  avatarUrl?: string;
}

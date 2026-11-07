import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WeaponConfig, Attachment, WeaponSkin } from '../types/game';
import { ATTACHMENTS_DATA, WEAPON_SKINS } from '../data/weaponsData';
import { createProceduralWeaponModel } from '../game/Weapon3D';
import { sound } from '../utils/audio';
import { Shield, Sparkles, Wrench, Layers, Crosshair, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface WeaponInspectorProps {
  weapons: WeaponConfig[];
  currentWeaponIndex: number;
  playerGears: number;
  onSelectWeapon: (idx: number) => void;
  onUpgradeWeapon: (weaponId: string) => void;
  onUnlockWeapon: (weaponId: string) => void;
  onEquipAttachment: (weaponId: string, slot: 'scope' | 'grip' | 'muzzle' | 'magazine', attId: string) => void;
  onSelectSkin: (weaponId: string, skinId: string) => void;
  onBack: () => void;
}

export const WeaponInspector: React.FC<WeaponInspectorProps> = ({
  weapons,
  currentWeaponIndex,
  playerGears,
  onSelectWeapon,
  onUpgradeWeapon,
  onUnlockWeapon,
  onEquipAttachment,
  onSelectSkin,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrade' | 'attachments' | 'skins'>('upgrade');
  const [selectedSlot, setSelectedSlot] = useState<'scope' | 'grip' | 'muzzle' | 'magazine'>('scope');
  const mountRef = useRef<HTMLDivElement | null>(null);

  const weapon = weapons[currentWeaponIndex];

  // 3D Preview Scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 1.25);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x00d2ff, 1.8);
    fillLight.position.set(-3, 1, -2);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x101b2b, 1.2);
    scene.add(ambientLight);

    // Weapon Model
    const weaponModel = createProceduralWeaponModel(weapon, false);
    weaponModel.rotation.y = Math.PI / 4;
    scene.add(weaponModel);

    // Drag to Rotate interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      weaponModel.rotation.y += deltaX * 0.01;
      weaponModel.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;
    const animate = () => {
      if (!isDragging) {
        weaponModel.rotation.y += 0.003; // subtle idle turntable spin
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

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
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount && dom.parentElement === mount) {
        mount.removeChild(dom);
      }
    };
  }, [weapon]);

  // Calculate current effective stats including level + attachments
  const calculateEffectiveStats = () => {
    const base = { ...weapon.baseStats };
    const levelMultiplier = 1 + (weapon.currentLevel - 1) * 0.12;
    base.damage = Math.round(base.damage * levelMultiplier);
    base.stability = Math.min(100, Math.round(base.stability * (1 + (weapon.currentLevel - 1) * 0.05)));

    // Apply attachments
    Object.entries(weapon.attachments).forEach(([slot, attId]) => {
      if (!attId) return;
      const att = ATTACHMENTS_DATA[slot]?.find((a) => a.id === attId);
      if (att && att.statModifiers) {
        if (att.statModifiers.damage) base.damage += att.statModifiers.damage;
        if (att.statModifiers.stability) base.stability = Math.min(100, base.stability + att.statModifiers.stability);
        if (att.statModifiers.range) base.range += att.statModifiers.range;
        if (att.statModifiers.magSize) base.magSize += att.statModifiers.magSize;
      }
    });

    return base;
  };

  const effectiveStats = calculateEffectiveStats();

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playUiClick();
              onBack();
            }}
            className="sci-btn px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 text-xs font-orbitron font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> 返回主選單
          </button>
          <div>
            <h1 className="font-orbitron font-extrabold text-2xl text-cyan-100 tracking-wider flex items-center gap-2">
              <Wrench className="w-6 h-6 text-cyan-400" />
              武器軍械改裝 (ARMORY & UPGRADE)
            </h1>
            <p className="text-xs text-cyan-400/70">幽影部隊高階戰術武器庫 // 自定義配件與能源升級</p>
          </div>
        </div>

        {/* Currency Scrap Display */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-4 py-2 rounded-lg">
          <span className="text-xs text-amber-400/80 font-chakra">零件齒輪 (GEARS):</span>
          <span className="font-orbitron font-bold text-amber-300 text-lg">⚙ {playerGears}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-6 mt-6 min-h-0">
        {/* Left Column: Weapon Selector Carousel & Description */}
        <div className="col-span-3 sci-box p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="text-xs font-orbitron text-cyan-400/80 mb-3 tracking-wider flex items-center justify-between">
              <span>SELECT FIREARM // 裝備槍械</span>
              <span className="text-[10px] text-emerald-400 font-bold">6/6 已全員裝備</span>
            </div>
            <div className="space-y-2">
              {weapons.map((w, idx) => {
                const isSelected = idx === currentWeaponIndex;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      sound.playUiClick();
                      onSelectWeapon(idx);
                    }}
                    className={`w-full text-left p-3 sci-btn transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(0,210,255,0.25)]'
                        : 'bg-slate-900/60 border-cyan-500/20 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-orbitron font-bold text-sm flex items-center gap-1.5">
                        <span className="text-[11px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                          [{idx + 1}]
                        </span>
                        <span>{w.id}</span>
                      </div>
                      <div className="text-[11px] text-cyan-400/70">{w.name}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-orbitron px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        已裝備
                      </span>
                      <span className="text-[9px] font-orbitron text-cyan-400/80">
                        LV.{w.currentLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-2">
            <div className="text-xs text-slate-300 leading-relaxed font-sans">
              {weapon.description}
            </div>
            <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">
              ⚡ 當前裝備欄位：<span className="text-cyan-100 font-bold">槽位 [{currentWeaponIndex + 1}]</span>
              <br />
              戰鬥中按鍵 <span className="text-amber-300 font-bold">[{currentWeaponIndex + 1}]</span> 或使用滾輪即可直接拔出使用。
            </div>
          </div>
        </div>

        {/* Center Column: 3D Turntable Inspection & Stat Bars */}
        <div className="col-span-6 flex flex-col gap-4 min-h-0">
          {/* 3D Weapon Canvas */}
          <div className="flex-1 sci-box relative overflow-hidden flex items-center justify-center">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            <div className="absolute top-3 left-4 text-[10px] font-mono text-cyan-400/60 pointer-events-none">
              [拖曳旋轉 3D 檢視 // 360° INSPECT]
            </div>
            <div className="absolute top-3 right-4 flex items-center gap-2 pointer-events-none">
              <span
                className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded border ${
                  weapon.fireMode === 'auto'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {weapon.fireMode === 'auto' ? '全自動模式 (AUTO)' : '半自動模式 (SEMI)'}
              </span>
              <span className="font-orbitron text-xs font-bold text-cyan-300">
                {weapon.name} // LV.{weapon.currentLevel}
              </span>
            </div>
          </div>

          {/* Stats Readout Bars (Damage, Fire Rate, Stability, Range) */}
          <div className="sci-box p-4 grid grid-cols-2 gap-4">
            {/* Damage */}
            <div>
              <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                <span>傷害 (DAMAGE)</span>
                <span className="font-bold">{effectiveStats.damage}</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-cyan-400 rounded-full shadow-[0_0_6px_#00f0ff]"
                  style={{ width: `${Math.min(100, (effectiveStats.damage / 130) * 100)}%` }}
                />
              </div>
            </div>

            {/* Fire Rate */}
            <div>
              <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                <span>射速 (FIRE RATE)</span>
                <span className="font-bold">{effectiveStats.fireRate} RPM</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-cyan-400 rounded-full shadow-[0_0_6px_#00f0ff]"
                  style={{ width: `${Math.min(100, (effectiveStats.fireRate / 1000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Stability */}
            <div>
              <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                <span>穩定性 (STABILITY)</span>
                <span className="font-bold">{effectiveStats.stability}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-cyan-400 rounded-full shadow-[0_0_6px_#00f0ff]"
                  style={{ width: `${effectiveStats.stability}%` }}
                />
              </div>
            </div>

            {/* Range */}
            <div>
              <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                <span>射程 (RANGE)</span>
                <span className="font-bold">{effectiveStats.range} M</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-cyan-400 rounded-full shadow-[0_0_6px_#00f0ff]"
                  style={{ width: `${Math.min(100, (effectiveStats.range / 160) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customization Tabs (Upgrade, Attachments, Skins) */}
        <div className="col-span-3 sci-box p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Tabs Header */}
            <div className="flex border-b border-cyan-500/30 mb-4">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('upgrade');
                }}
                className={`flex-1 py-2 text-xs font-orbitron font-bold transition-all cursor-pointer ${
                  activeTab === 'upgrade'
                    ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                武器升級
              </button>
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('attachments');
                }}
                className={`flex-1 py-2 text-xs font-orbitron font-bold transition-all cursor-pointer ${
                  activeTab === 'attachments'
                    ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                配件改裝
              </button>
              <button
                onClick={() => {
                  sound.playUiClick();
                  setActiveTab('skins');
                }}
                className={`flex-1 py-2 text-xs font-orbitron font-bold transition-all cursor-pointer ${
                  activeTab === 'skins'
                    ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                外觀塗裝
              </button>
            </div>

            {/* TAB 1: WEAPON UPGRADE */}
            {activeTab === 'upgrade' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-900/80 border border-cyan-500/20 rounded">
                  <div className="text-xs font-orbitron text-cyan-300 mb-1">
                    當前等級：LV.{weapon.currentLevel} / {weapon.maxLevel}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    升級武器可整體提升子彈動能傷害 (+12%)、降低槍口垂直散佈 (+5% 穩定性)，並提升彈匣備彈上限。
                  </p>
                </div>

                {weapon.unlocked ? (
                  weapon.currentLevel < weapon.maxLevel ? (
                    <button
                      onClick={() => {
                        sound.playReload();
                        onUpgradeWeapon(weapon.id);
                      }}
                      disabled={playerGears < weapon.upgradeCost}
                      className={`w-full py-3 sci-btn font-orbitron font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                        playerGears >= weapon.upgradeCost
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_#00f0ff]'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Wrench className="w-4 h-4" /> 升級槍械 (⚙ {weapon.upgradeCost})
                    </button>
                  ) : (
                    <div className="py-3 text-center font-orbitron font-bold text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-950/40 rounded">
                      ✓ 已達最高改裝等級 (MAX LEVEL)
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => {
                      sound.playReload();
                      onUnlockWeapon(weapon.id);
                    }}
                    disabled={playerGears < weapon.unlockCost}
                    className={`w-full py-3 sci-btn font-orbitron font-bold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                      playerGears >= weapon.unlockCost
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_#f59e0b]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    解鎖此武器 (⚙ {weapon.unlockCost})
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: ATTACHMENTS */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                {/* Slot Selector */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(['scope', 'grip', 'muzzle', 'magazine'] as const).map((slot) => {
                    const label = slot === 'scope' ? '瞄準鏡' : slot === 'grip' ? '握把' : slot === 'muzzle' ? '槍口' : '彈匣';
                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          sound.playUiClick();
                          setSelectedSlot(slot);
                        }}
                        className={`py-1.5 text-[11px] font-chakra rounded border transition-all cursor-pointer ${
                          selectedSlot === slot
                            ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-[0_0_8px_#00f0ff]'
                            : 'bg-slate-900 text-slate-300 border-cyan-500/20 hover:bg-slate-800'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Available Attachments in Selected Slot */}
                <div className="space-y-2 mt-3">
                  {ATTACHMENTS_DATA[selectedSlot]?.map((att) => {
                    const isEquipped = weapon.attachments[selectedSlot] === att.id;
                    return (
                      <div
                        key={att.id}
                        onClick={() => {
                          sound.playUiClick();
                          onEquipAttachment(weapon.id, selectedSlot, att.id);
                        }}
                        className={`p-2.5 rounded border transition-all cursor-pointer ${
                          isEquipped
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(0,210,255,0.2)]'
                            : 'bg-slate-900/60 border-cyan-500/20 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-chakra font-bold text-xs">{att.name}</span>
                          {isEquipped && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{att.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: WEAPON SKINS */}
            {activeTab === 'skins' && (
              <div className="space-y-2.5">
                {WEAPON_SKINS.map((skin) => {
                  const isSelected = weapon.selectedSkin === skin.id;
                  return (
                    <div
                      key={skin.id}
                      onClick={() => {
                        sound.playUiClick();
                        onSelectSkin(weapon.id, skin.id);
                      }}
                      className={`p-3 rounded border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(0,210,255,0.25)]'
                          : 'bg-slate-900/60 border-cyan-500/20 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Swatch preview */}
                        <div
                          className="w-5 h-5 rounded border border-white/20 shadow"
                          style={{ backgroundColor: skin.glowColor }}
                        />
                        <span className="font-chakra font-medium text-xs text-slate-100">
                          {skin.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[10px] text-center font-mono text-cyan-400/50 mt-4">
            SHADOW OPS // ARMAMENT UPGRADE BENCH
          </div>
        </div>
      </div>
    </div>
  );
};

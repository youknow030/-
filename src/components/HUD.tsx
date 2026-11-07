import React from 'react';
import { PlayerStats, WeaponConfig, Enemy, MissionChapter } from '../types/game';
import { RadarMap } from './RadarMap';
import { Shield, Heart, Zap, Crosshair, Clock } from 'lucide-react';

interface HUDProps {
  playerStats: PlayerStats;
  currentWeapon: WeaponConfig;
  allWeapons: WeaponConfig[];
  mission: MissionChapter;
  enemies: Enemy[];
  enemiesKilled: number;
  totalEnemies: number;
  playerPos: { x: number; z: number; angle: number };
  timeRemaining?: number;
  isAds: boolean;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  hitMarker: { visible: boolean; isHeadshot: boolean; damage: number } | null;
  hurtFlash: boolean;
  onSelectWeapon: (idx: number) => void;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerStats,
  currentWeapon,
  allWeapons,
  mission,
  enemies,
  enemiesKilled,
  totalEnemies,
  playerPos,
  timeRemaining = 150,
  isAds,
  isReloading,
  reloadProgress,
  hitMarker,
  hurtFlash,
  onSelectWeapon,
  onTogglePause,
}) => {
  const [fps, setFps] = React.useState(60);
  const frameCountRef = React.useRef(0);
  const lastTimeRef = React.useRef(performance.now());

  React.useEffect(() => {
    let animId: number;
    const calcFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 800) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  const hpPct = Math.max(0, Math.min(100, (playerStats.hp / playerStats.maxHp) * 100));
  const shieldPct = Math.max(0, Math.min(100, (playerStats.shield / playerStats.maxShield) * 100));
  const staminaPct = Math.max(0, Math.min(100, (playerStats.stamina / playerStats.maxStamina) * 100));

  const scopeType = currentWeapon.attachments.scope || (currentWeapon.id === 'SR-12' ? 'scope_sniper_4x' : 'scope_holo');
  const isSniper = scopeType === 'scope_sniper_4x' || currentWeapon.id === 'SR-12';
  const isReflex = scopeType === 'scope_reflex';
  const isHolo = scopeType === 'scope_holo';
  const isIron = scopeType === 'scope_iron';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden">
      {/* Red Hurt Flash Screen Vignette */}
      {hurtFlash && (
        <div className="absolute inset-0 bg-red-600/25 pointer-events-none animate-pulse transition-opacity duration-200" />
      )}

      {/* 4X Optical Sniper Scope Overlay ONLY (SR-12 or 4X Sniper attachment) */}
      {isAds && isSniper && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Outer Black Mask with Circular Lens Cutout */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_230px,rgba(3,7,18,0.95)_255px,rgba(2,6,12,0.99)_100%)]" />

          {/* Scope Lens Border & Lens Glare Ring */}
          <div className="relative w-[480px] h-[480px] rounded-full border border-cyan-400/40 shadow-[inset_0_0_80px_rgba(0,210,255,0.15)] flex items-center justify-center">
            {/* Antireflective coating tint */}
            <div className="absolute inset-0 rounded-full bg-cyan-950/15" />

            {/* Ultra-thin Crosshairs */}
            <div className="absolute w-full h-[1px] bg-slate-200/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
            <div className="absolute h-full w-[1px] bg-slate-200/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />

            {/* Mil-dot stadia hashes on vertical axis */}
            {[-120, -90, -60, -30, 30, 60, 90, 120].map((offset) => (
              <div
                key={offset}
                className="absolute h-[1px] bg-slate-200"
                style={{
                  top: `calc(50% + ${offset}px)`,
                  width: offset % 60 === 0 ? '16px' : '8px',
                }}
              />
            ))}

            {/* Mil-dot stadia hashes on horizontal axis */}
            {[-120, -90, -60, -30, 30, 60, 90, 120].map((offset) => (
              <div
                key={offset}
                className="absolute w-[1px] bg-slate-200"
                style={{
                  left: `calc(50% + ${offset}px)`,
                  height: offset % 60 === 0 ? '16px' : '8px',
                }}
              />
            ))}

            {/* Range rings */}
            <div className="w-24 h-24 rounded-full border border-slate-400/30" />
            <div className="w-48 h-48 rounded-full border border-slate-400/20" />

            {/* Center illuminated amber/cyan cross pip */}
            <div className="relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            </div>

            {/* Tactical Telemetry on Scope Border */}
            <div className="absolute top-8 font-orbitron text-[10px] tracking-widest text-cyan-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              4X OPTICAL MAGNIFICATION // MIL-DOT
            </div>
            <div className="absolute bottom-8 font-mono text-[9px] text-amber-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              HDG {Math.abs(Math.round((playerPos.angle * 180) / Math.PI)) % 360}° // ELEV 0.0°
            </div>
          </div>
        </div>
      )}

      {/* 2D Optical Sights for all remaining sights (Reflex Red Dot, Holo 65 MOA, Iron Sights) */}
      {isAds && !isSniper && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Micro Reflex Sight (2D Red Dot) */}
          {isReflex && (
            <div className="relative flex items-center justify-center animate-in fade-in zoom-in-95 duration-100">
              {/* Reflex sight lens glass frame */}
              <div className="w-52 h-40 rounded-2xl border-2 border-slate-700/80 bg-cyan-950/10 backdrop-blur-[0.5px] shadow-[0_0_25px_rgba(0,0,0,0.6),inset_0_0_15px_rgba(0,210,255,0.08)] flex items-center justify-center relative">
                {/* Thin lens rim reflection */}
                <div className="absolute inset-1 rounded-xl border border-cyan-400/20" />

                {/* Bright Glowing RED DOT */}
                <div className="relative flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-600/40 animate-ping absolute" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#ff0033,0_0_4px_#ffffff] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                </div>

                <div className="absolute -top-6 text-[9px] font-orbitron tracking-widest text-red-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-red-500/30">
                  2D REFLEX // RED DOT
                </div>
              </div>
            </div>
          )}

          {/* Holo Sight (EOTech 65 MOA Cyan Circle + 1 MOA Pip) */}
          {isHolo && (
            <div className="relative flex items-center justify-center animate-in fade-in zoom-in-95 duration-100">
              {/* Holo sight rectangular window */}
              <div className="w-60 h-48 rounded-xl border-2 border-slate-700/70 bg-cyan-950/15 backdrop-blur-[0.5px] shadow-[0_0_25px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,210,255,0.1)] flex items-center justify-center relative">
                {/* 65 MOA Holographic Ring */}
                <div className="relative w-24 h-24 rounded-full border border-cyan-400/80 shadow-[0_0_12px_#00f0ff] flex items-center justify-center">
                  {/* Top, bottom, left, right tick marks */}
                  <div className="absolute -top-2 w-[2px] h-2 bg-cyan-300" />
                  <div className="absolute -bottom-2 w-[2px] h-2 bg-cyan-300" />
                  <div className="absolute -left-2 h-[2px] w-2 bg-cyan-300" />
                  <div className="absolute -right-2 h-[2px] w-2 bg-cyan-300" />

                  {/* 1 MOA Center Aiming Pip */}
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#00f0ff]" />
                </div>

                <div className="absolute -top-6 text-[9px] font-orbitron tracking-widest text-cyan-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  2D HOLOGRAPHIC // 65 MOA
                </div>
              </div>
            </div>
          )}

          {/* Iron Sights (Mechanical Focus) */}
          {isIron && (
            <div className="relative flex items-center justify-center animate-in fade-in zoom-in-95 duration-100">
              <div className="flex flex-col items-center">
                {/* Front Post Tritium Dot */}
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                <div className="w-[2px] h-5 bg-slate-500" />
              </div>
              <div className="absolute -top-7 text-[9px] font-orbitron tracking-widest text-emerald-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                2D TACTICAL IRON SIGHTS
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard Center Crosshair (when not in full scope) */}
      {!isAds && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {currentWeapon.category === '霰彈槍' || currentWeapon.id === 'SG-4' ? (
            /* Tactical Shotgun Buckshot Spread Reticle */
            <div className="relative w-12 h-12 rounded-full border border-cyan-400/60 shadow-[0_0_10px_rgba(0,210,255,0.3)] flex items-center justify-center">
              <div className="absolute -top-1 w-0.5 h-1.5 bg-cyan-300" />
              <div className="absolute -bottom-1 w-0.5 h-1.5 bg-cyan-300" />
              <div className="absolute -left-1 h-0.5 w-1.5 bg-cyan-300" />
              <div className="absolute -right-1 h-0.5 w-1.5 bg-cyan-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_4px_#00f0ff]" />
            </div>
          ) : (
            <div className="relative w-8 h-8 flex items-center justify-center">
              {/* Top tick */}
              <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400/80 shadow-[0_0_4px_#00f0ff]" />
              {/* Bottom tick */}
              <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400/80 shadow-[0_0_4px_#00f0ff]" />
              {/* Left tick */}
              <div className="absolute -left-3 h-0.5 w-2 bg-cyan-400/80 shadow-[0_0_4px_#00f0ff]" />
              {/* Right tick */}
              <div className="absolute -right-3 h-0.5 w-2 bg-cyan-400/80 shadow-[0_0_4px_#00f0ff]" />
              {/* Center dot */}
              <div className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_4px_#00f0ff]" />
            </div>
          )}
        </div>
      )}

      {/* Hit Marker & Floating Damage Popup */}
      {hitMarker && hitMarker.visible && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* X Cross Hitmark */}
            <div className={`w-8 h-8 relative animate-ping ${hitMarker.isHeadshot ? 'text-amber-400' : 'text-red-500'}`}>
              <div className="absolute inset-0 rotate-45 border-2 border-current" />
            </div>
            <div
              className={`absolute -top-7 left-1/2 -translate-x-1/2 font-orbitron font-extrabold text-sm tracking-wider ${
                hitMarker.isHeadshot ? 'text-amber-300 drop-shadow-[0_0_8px_#f59e0b]' : 'text-red-400 drop-shadow-[0_0_6px_#ef4444]'
              }`}
            >
              {hitMarker.isHeadshot ? `CRIT -${hitMarker.damage}` : `-${hitMarker.damage}`}
            </div>
          </div>
        </div>
      )}

      {/* TOP-LEFT: Mission Objective Card */}
      <div className="absolute top-4 left-5 max-w-sm pointer-events-auto">
        <div className="sci-box p-3 border-l-4 border-l-cyan-400 bg-slate-950/85 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rotate-45 bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
            <h3 className="font-orbitron font-bold text-xs tracking-wider text-cyan-300">
              任務目標 (MISSION OBJECTIVE)
            </h3>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-100 font-medium">
              ◆ {mission.mainObjective}
            </span>
            <span className="font-orbitron font-bold text-amber-400 text-sm shrink-0">
              ({enemiesKilled} / {totalEnemies})
            </span>
          </div>
          <div className="mt-1.5 text-[10px] text-cyan-300/80 flex items-center gap-1.5">
            <span className="text-cyan-500">次要:</span> {mission.secondaryObjective}
          </div>
        </div>
      </div>

      {/* TOP-CENTER: Tactical Mission Countdown & Kill Quota */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1.5 z-20">
        {/* Countdown Box */}
        <div
          className={`px-4 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-widest flex items-center gap-2.5 shadow-xl backdrop-blur-md transition-all ${
            timeRemaining <= 30
              ? 'bg-red-950/90 border-red-500 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse scale-105'
              : timeRemaining <= 60
              ? 'bg-amber-950/90 border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-slate-950/90 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
          }`}
        >
          <Clock className={`w-4 h-4 ${timeRemaining <= 30 ? 'text-red-400 animate-spin' : 'text-cyan-400'}`} />
          <span className="text-xs text-slate-300 font-sans tracking-normal">作戰倒數</span>
          <span className="font-orbitron font-extrabold text-base tracking-wider">
            {`${String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:${String(Math.max(0, timeRemaining % 60)).padStart(2, '0')}`}
          </span>
        </div>

        {/* Clear quota badge */}
        <div className="px-3 py-0.5 rounded-full bg-slate-950/80 border border-cyan-500/30 text-[10px] font-orbitron text-cyan-300 flex items-center gap-2">
          <span>殲敵進度</span>
          <span className="text-amber-300 font-bold font-mono">
            {enemiesKilled} / {totalEnemies} 機
          </span>
          {enemiesKilled >= totalEnemies ? (
            <span className="text-emerald-400 font-bold">【全部消滅】</span>
          ) : (
            <span className="text-cyan-400/70">剩餘 {totalEnemies - enemiesKilled} 機</span>
          )}
        </div>
      </div>

      {/* TOP-RIGHT: Tactical Radar Minimap, FPS Telemetry & Menu Button */}
      <div className="absolute top-4 right-5 flex flex-col items-end gap-2 pointer-events-auto">
        <RadarMap playerPos={playerPos} enemies={enemies} />
        <div className="flex items-center gap-2">
          {/* Real-time FPS & Fluidity Badge */}
          <div className="px-2 py-0.5 rounded bg-slate-950/85 border border-cyan-500/30 text-[10px] font-mono flex items-center gap-1.5 shadow-sm">
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                fps >= 55 ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : fps >= 30 ? 'bg-amber-400' : 'bg-red-400'
              }`}
            />
            <span className={fps >= 55 ? 'text-emerald-300 font-bold' : 'text-amber-300'}>{fps} FPS</span>
            <span className="text-cyan-500/70 text-[9px]">{(1000 / Math.max(1, fps)).toFixed(1)}ms</span>
          </div>
          <button
            onClick={onTogglePause}
            className="sci-btn px-3 py-1 bg-slate-900/90 hover:bg-cyan-950 border border-cyan-500/40 text-[11px] font-orbitron text-cyan-300 flex items-center gap-1.5 cursor-pointer"
          >
            <span>ESC 選單</span>
          </button>
        </div>
      </div>

      {/* BOTTOM-LEFT: Kane Character Health, Shield & Stamina Bars */}
      <div className="absolute bottom-5 left-5 pointer-events-auto">
        <div className="sci-box p-3 bg-slate-950/90 backdrop-blur-md flex items-center gap-3.5 border-cyan-500/40">
          {/* Avatar with Helmet Glow */}
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-cyan-400 bg-slate-900 shrink-0 shadow-[0_0_12px_rgba(0,210,255,0.4)]">
            <img
              src="/assets/aistudio/_____________9e08efa2.png"
              alt="Kane"
              className="w-full h-full object-cover object-top scale-150"
            />
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] font-orbitron text-cyan-300 text-center font-bold">
              LV.{playerStats.level}
            </div>
          </div>

          {/* Bars Column */}
          <div className="w-52 space-y-1.5">
            {/* HP Bar */}
            <div>
              <div className="flex justify-between text-[10px] font-orbitron font-semibold text-emerald-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-emerald-400 fill-emerald-400" /> HP
                </span>
                <span>
                  {Math.round(playerStats.hp)} / {playerStats.maxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 border border-emerald-500/30 rounded-sm overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-150 rounded-sm shadow-[0_0_6px_#10b981]"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {/* SP (Shield) Bar */}
            <div>
              <div className="flex justify-between text-[10px] font-orbitron font-semibold text-cyan-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400" /> SP 護盾
                </span>
                <span>
                  {Math.round(playerStats.shield)} / {playerStats.maxShield}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 border border-cyan-500/30 rounded-sm overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-150 rounded-sm shadow-[0_0_6px_#00f0ff]"
                  style={{ width: `${shieldPct}%` }}
                />
              </div>
            </div>

            {/* Stamina Bar */}
            <div>
              <div className="flex justify-between text-[9px] font-orbitron text-amber-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> STAMINA 體力
                </span>
                <span>{Math.round(playerStats.stamina)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 border border-amber-500/30 rounded-sm overflow-hidden p-0.5">
                <div
                  className="h-full bg-amber-400 transition-all duration-100 rounded-sm"
                  style={{ width: `${staminaPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: Weapon Info, Ammo Counter & Weapon Select Slots */}
      <div className="absolute bottom-5 right-5 pointer-events-auto flex flex-col items-end gap-2.5">
        {/* Main Ammo & Weapon Card */}
        <div className="sci-box p-3.5 bg-slate-950/90 backdrop-blur-md border-cyan-500/40 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-2 gap-2">
            <span className="font-orbitron font-bold text-xs text-cyan-300 truncate">
              {currentWeapon.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`text-[9px] font-orbitron px-1.5 py-0.5 rounded font-bold border ${
                  currentWeapon.fireMode === 'auto'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {currentWeapon.fireMode === 'auto' ? '全自動 [AUTO]' : '半自動 [SEMI]'}
              </span>
              <span className="text-[10px] font-sans text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {currentWeapon.category}
              </span>
            </div>
          </div>

          {/* Large Stylized Ammo Digits */}
          <div className="flex items-baseline justify-end gap-2">
            <span className="font-orbitron font-extrabold text-4xl text-cyan-100 tracking-tight drop-shadow-[0_0_12px_rgba(0,210,255,0.4)]">
              {currentWeapon.currentMag}
            </span>
            <span className="font-orbitron text-base text-cyan-400/60">/</span>
            <span className="font-orbitron text-lg font-semibold text-cyan-400/70">
              {currentWeapon.totalReserve}
            </span>
          </div>

          {/* Reload Progress bar or Low Ammo warning */}
          {isReloading ? (
            <div className="mt-2">
              <div className="flex justify-between text-[9px] font-orbitron text-amber-400 mb-0.5">
                <span>RELOADING...</span>
                <span>{Math.round(reloadProgress * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${reloadProgress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            currentWeapon.currentMag <= 5 && (
              <div className="mt-1 text-center font-orbitron text-[10px] font-bold text-amber-400 animate-pulse">
                [R] 裝填彈藥 (RELOAD)
              </div>
            )
          )}
        </div>

        {/* Quick Weapon Slots [1] ~ [6] 全6把武器裝備列 */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[480px]">
          {allWeapons.slice(0, 6).map((w, idx) => {
            const isEquipped = w.id === currentWeapon.id;
            return (
              <button
                key={w.id}
                onClick={() => onSelectWeapon(idx)}
                title={`[按鍵 ${idx + 1}] 切換至 ${w.name}`}
                className={`sci-btn px-2.5 py-1 text-xs font-orbitron transition-all cursor-pointer flex items-center gap-1.5 rounded border ${
                  isEquipped
                    ? 'bg-cyan-500 text-black font-extrabold border-cyan-300 shadow-[0_0_14px_#00f0ff] scale-105 z-10'
                    : 'bg-slate-900/90 text-cyan-400 hover:bg-slate-800 border-cyan-500/30 hover:border-cyan-400/60'
                }`}
              >
                <span
                  className={`text-[10px] font-bold px-1 rounded ${
                    isEquipped ? 'bg-black/25 text-black' : 'bg-cyan-950/80 text-cyan-300'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="font-semibold">{w.id}</span>
                <span className={`text-[10px] font-mono ${isEquipped ? 'text-black/80 font-bold' : 'text-cyan-500/80'}`}>
                  {w.currentMag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM-CENTER: Control Keybinding Tooltips */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2.5 text-[10px] font-mono text-cyan-400/70 bg-slate-950/85 px-4 py-1 rounded-full border border-cyan-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.5)]">
        <span>[WASD] 移動</span>
        <span>•</span>
        <span>[Shift] 奔跑</span>
        <span>•</span>
        <span>[Space] 跳躍</span>
        <span>•</span>
        <span className="text-cyan-200 font-bold">[1-6 / 滾輪] 切換 6 把武器</span>
        <span>•</span>
        <span>[左鍵] 射擊</span>
        <span>•</span>
        <span>[右鍵] 瞄準 (ADS)</span>
        <span>•</span>
        <span>[R] 換彈</span>
      </div>
    </div>
  );
};

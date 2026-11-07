import React from 'react';
import { sound } from '../utils/audio';
import { Play, RotateCcw, ListFilter, Wrench, User, Settings, Volume2, VolumeX } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  onMissionSelect: () => void;
  onArmory: () => void;
  onCharacterSheet: () => void;
  onSettings: () => void;
  playerLevel: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onMissionSelect,
  onArmory,
  onCharacterSheet,
  onSettings,
  playerLevel,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    if (isMuted) {
      sound.setVolumes(0.8, 0.8, 0.35);
      sound.startAmbientBgm();
      setIsMuted(false);
    } else {
      sound.setVolumes(0, 0, 0);
      setIsMuted(true);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between p-8">
      {/* Background Cinematic Visual from Concept Art */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/aistudio/_______________47390514.png"
          alt="Zero Front Main Screen"
          className="w-full h-full object-cover object-top filter brightness-[0.7] contrast-[1.1] scale-105"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />
        <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />
      </div>

      {/* TOP BAR: Audio toggle, Status, Version */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-400/50 text-[11px] font-orbitron text-cyan-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            SHADOW OPS // ONLINE
          </div>
          <span className="text-xs font-mono text-cyan-400/60">VER 1.0.4-RELEASE</span>
        </div>

        <button
          onClick={toggleMute}
          className="sci-btn p-2.5 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded cursor-pointer transition-all"
          title={isMuted ? '開啟音效與氛圍音樂' : '靜音'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
        </button>
      </div>

      {/* CENTER-LEFT: Zero Front Logo & Menu List */}
      <div className="relative z-10 max-w-lg space-y-6 my-auto">
        {/* Game Title Logo matching reference artwork */}
        <div className="space-y-1">
          <div className="inline-block px-2 py-0.5 bg-cyan-500 text-black font-orbitron font-extrabold text-[10px] tracking-widest rounded-sm mb-1">
            2089 TACTICAL FIRST-PERSON SHOOTER
          </div>
          <h1 className="font-orbitron font-black text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-400 tracking-wider drop-shadow-[0_0_35px_rgba(0,210,255,0.6)]">
            零界突襲
          </h1>
          <div className="font-orbitron font-extrabold text-2xl text-cyan-400 tracking-[0.35em] drop-shadow-[0_0_15px_#00f0ff]">
            ZERO FRONT
          </div>
        </div>

        {/* Menu Buttons matching reference artwork layout */}
        <div className="space-y-2.5 w-72">
          {/* Start Game */}
          <button
            onClick={() => {
              sound.playUiClick();
              sound.startAmbientBgm();
              onStartGame();
            }}
            className="w-full sci-btn py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-extrabold text-base tracking-wider flex items-center gap-3 cursor-pointer shadow-[0_0_25px_#00f0ff] transition-all"
          >
            <Play className="w-5 h-5 fill-black" /> 開始遊戲
          </button>

          {/* Continue Game */}
          <button
            onClick={() => {
              sound.playUiClick();
              sound.startAmbientBgm();
              onStartGame();
            }}
            className="w-full sci-btn py-2.5 px-6 bg-slate-900/80 hover:bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 font-orbitron font-bold text-sm tracking-wider flex items-center gap-3 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" /> 繼續遊戲
          </button>

          {/* Mission Select */}
          <button
            onClick={() => {
              sound.playUiClick();
              onMissionSelect();
            }}
            className="w-full sci-btn py-2.5 px-6 bg-slate-900/80 hover:bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 font-orbitron font-bold text-sm tracking-wider flex items-center gap-3 cursor-pointer transition-all"
          >
            <ListFilter className="w-4 h-4 text-cyan-400" /> 任務選擇
          </button>

          {/* Weapons & Armory */}
          <button
            onClick={() => {
              sound.playUiClick();
              onArmory();
            }}
            className="w-full sci-btn py-2.5 px-6 bg-slate-900/80 hover:bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 font-orbitron font-bold text-sm tracking-wider flex items-center gap-3 cursor-pointer transition-all"
          >
            <Wrench className="w-4 h-4 text-cyan-400" /> 武器裝備
          </button>

          {/* Character Dossier */}
          <button
            onClick={() => {
              sound.playUiClick();
              onCharacterSheet();
            }}
            className="w-full sci-btn py-2.5 px-6 bg-slate-900/80 hover:bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 font-orbitron font-bold text-sm tracking-wider flex items-center gap-3 cursor-pointer transition-all"
          >
            <User className="w-4 h-4 text-cyan-400" /> 角色資訊
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              sound.playUiClick();
              onSettings();
            }}
            className="w-full sci-btn py-2.5 px-6 bg-slate-900/80 hover:bg-cyan-950/80 text-cyan-300 hover:text-white border border-cyan-500/40 font-orbitron font-bold text-sm tracking-wider flex items-center gap-3 cursor-pointer transition-all"
          >
            <Settings className="w-4 h-4 text-cyan-400" /> 遊戲設定
          </button>
        </div>
      </div>

      {/* BOTTOM FOOTER: Tagline from design proposal & Kane quote */}
      <div className="relative z-10 flex items-end justify-between border-t border-cyan-500/20 pt-4">
        <div>
          <p className="font-chakra text-slate-300 text-sm tracking-wider">
            在遭混亂的世界中，找到最後的希望……
          </p>
          <p className="font-sans text-[11px] text-cyan-400/60 mt-0.5">
            「這次……我一定要找到真相。」 —— 幽影部隊 凱恩 (Kane)
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono text-cyan-400/50">
            POWERED BY HIGH-PERFORMANCE WEBGL 3D ENGINE
          </div>
        </div>
      </div>
    </div>
  );
};

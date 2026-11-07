import React, { useState } from 'react';
import { CHARACTERS_DATA, CharacterProfile } from '../data/charactersData';
import { sound } from '../utils/audio';
import { ChevronLeft, User, Shield, Target, Cpu, Activity } from 'lucide-react';

interface CharacterSheetProps {
  onBack: () => void;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ onBack }) => {
  const [selectedCharId, setSelectedCharId] = useState<string>('kane');
  const character = CHARACTERS_DATA.find((c) => c.id === selectedCharId) || CHARACTERS_DATA[0];

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
              <User className="w-6 h-6 text-cyan-400" />
              幽影特遣隊員檔案 (OPERATOR DOSSIER)
            </h1>
            <p className="text-xs text-cyan-400/70">作戰部隊機密人員資料與戰術體能參數評估</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 mt-6 min-h-0">
        {/* Left Column: Character Roster Picker */}
        <div className="col-span-3 space-y-3">
          <div className="text-xs font-orbitron text-cyan-400/80 mb-2 tracking-wider">
            ROSTER // 特遣成員名冊
          </div>
          {CHARACTERS_DATA.map((c) => {
            const isSelected = c.id === selectedCharId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  sound.playUiClick();
                  setSelectedCharId(c.id);
                }}
                className={`w-full text-left p-3.5 sci-btn transition-all cursor-pointer border flex items-center gap-3 ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(0,210,255,0.25)]'
                    : 'bg-slate-900/60 border-cyan-500/20 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-12 h-12 rounded overflow-hidden border border-cyan-500/40 shrink-0 bg-slate-900">
                  <img
                    src={c.id === 'kane' ? '/assets/aistudio/_____________9e08efa2.png' : '/assets/aistudio/_______________47390514.png'}
                    alt={c.name}
                    className="w-full h-full object-cover object-top scale-125"
                  />
                </div>
                <div>
                  <div className="font-orbitron font-bold text-sm text-cyan-200">
                    {c.name} <span className="text-xs text-cyan-400/60 font-mono">({c.enName})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{c.role}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center & Right Column: Character Visual & Detailed Dossier */}
        <div className="col-span-9 sci-box p-6 grid grid-cols-12 gap-6 overflow-y-auto">
          {/* Character Artwork Presentation */}
          <div className="col-span-5 flex flex-col justify-between">
            <div className="relative rounded-lg overflow-hidden border border-cyan-500/50 bg-slate-900/80 shadow-2xl flex-1 max-h-[500px]">
              <img
                src={character.id === 'kane' ? '/assets/aistudio/_____________9e08efa2.png' : '/assets/aistudio/_______________47390514.png'}
                alt={character.name}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-500/30 text-[10px] font-orbitron text-cyan-300">
                OFFICIAL DESIGN SHEET
              </div>
            </div>

            {/* Character Signature Quote */}
            <div className="mt-4 p-3 bg-cyan-950/40 border-l-4 border-l-cyan-400 rounded text-cyan-200 text-xs italic font-serif">
              {character.quote}
            </div>
          </div>

          {/* Dossier Information */}
          <div className="col-span-7 space-y-4">
            <div>
              <div className="flex items-baseline justify-between border-b border-cyan-500/30 pb-2">
                <h2 className="font-orbitron font-extrabold text-2xl text-cyan-100">
                  {character.name} // {character.enName}
                </h2>
                <span className="font-mono text-sm text-cyan-400/80">{character.age} 歲</span>
              </div>
              <div className="text-xs font-chakra text-amber-400 mt-1 font-semibold">
                {character.role}
              </div>
            </div>

            {/* Stats Bars */}
            <div className="sci-box p-4 grid grid-cols-2 gap-3.5">
              <div>
                <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-cyan-400" /> 突擊強度 (ASSAULT)
                  </span>
                  <span className="font-bold">{character.stats.assault}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded border border-cyan-500/30 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]"
                    style={{ width: `${character.stats.assault}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" /> 戰術指揮 (TACTICS)
                  </span>
                  <span className="font-bold">{character.stats.tactics}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded border border-cyan-500/30 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]"
                    style={{ width: `${character.stats.tactics}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> 電子駭入 (HACKING)
                  </span>
                  <span className="font-bold">{character.stats.hacking}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded border border-cyan-500/30 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]"
                    style={{ width: `${character.stats.hacking}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" /> 生存韌性 (SURVIVAL)
                  </span>
                  <span className="font-bold">{character.stats.survival}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded border border-cyan-500/30 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]"
                    style={{ width: `${character.stats.survival}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Personality & Appearance */}
            <div className="space-y-2 text-xs">
              <div className="bg-slate-900/60 p-3 rounded border border-cyan-500/20">
                <span className="text-cyan-400 font-bold font-orbitron">性格分析：</span>
                <span className="text-slate-300 ml-1 font-sans">{character.personality}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded border border-cyan-500/20">
                <span className="text-cyan-400 font-bold font-orbitron">外觀特徵：</span>
                <span className="text-slate-300 ml-1 font-sans">{character.appearance}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded border border-cyan-500/20">
                <span className="text-cyan-400 font-bold font-orbitron">戰鬥專長：</span>
                <span className="text-slate-300 ml-1 font-sans">{character.features}</span>
              </div>
            </div>

            {/* Backstory */}
            <div className="bg-slate-900/80 p-4 rounded border border-cyan-500/30">
              <div className="text-xs font-orbitron font-bold text-cyan-300 mb-2">
                角色歷史背景 (BACKGROUND ARCHIVE)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {character.background}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

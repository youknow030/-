import React, { useState } from 'react';
import { MissionChapter, MissionEnvironment } from '../types/game';
import { MISSIONS_DATA } from '../data/missionsData';
import { sound } from '../utils/audio';
import {
  ChevronLeft,
  Crosshair,
  Award,
  Coins,
  Wrench,
  ShieldAlert,
  Flame,
  Radio,
  Building,
  Zap,
  Globe,
  Factory,
  Skull,
  Bot,
} from 'lucide-react';

interface MissionSelectProps {
  onSelectMission: (mission: MissionChapter) => void;
  onBack: () => void;
}

const ENV_META: Record<
  MissionEnvironment,
  { label: string; tagColor: string; bgGradient: string; icon: React.ReactNode }
> = {
  industrial: {
    label: '重工廢墟',
    tagColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    bgGradient: 'from-amber-950/30 to-slate-950',
    icon: <Building className="w-3.5 h-3.5 text-amber-400" />,
  },
  lab: {
    label: '極光地下設施',
    tagColor: 'text-sky-400 border-sky-500/40 bg-sky-950/40',
    bgGradient: 'from-sky-950/30 to-slate-950',
    icon: <Zap className="w-3.5 h-3.5 text-sky-400" />,
  },
  city: {
    label: '霓虹市區封鎖',
    tagColor: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-950/40',
    bgGradient: 'from-fuchsia-950/30 to-slate-950',
    icon: <Globe className="w-3.5 h-3.5 text-fuchsia-400" />,
  },
  orbital: {
    label: '浮空軌道平台',
    tagColor: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/40',
    bgGradient: 'from-yellow-950/30 to-slate-950',
    icon: <Globe className="w-3.5 h-3.5 text-yellow-400" />,
  },
  reactor: {
    label: '電漿超導爐',
    tagColor: 'text-orange-400 border-orange-500/40 bg-orange-950/40',
    bgGradient: 'from-orange-950/30 to-slate-950',
    icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
  },
  mech_factory: {
    label: '泰坦兵工廠',
    tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    bgGradient: 'from-emerald-950/30 to-slate-950',
    icon: <Factory className="w-3.5 h-3.5 text-emerald-400" />,
  },
  core: {
    label: '零界核心塔頂',
    tagColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    bgGradient: 'from-cyan-950/30 to-slate-950',
    icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
  },
  abyss: {
    label: '時空奇異點裂縫',
    tagColor: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
    bgGradient: 'from-purple-950/30 to-slate-950',
    icon: <Skull className="w-3.5 h-3.5 text-purple-400" />,
  },
  choice: {
    label: '終焉抉擇之巔',
    tagColor: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
    bgGradient: 'from-rose-950/30 to-slate-950',
    icon: <Radio className="w-3.5 h-3.5 text-rose-400" />,
  },
};

export const MissionSelect: React.FC<MissionSelectProps> = ({ onSelectMission, onBack }) => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const activeMission = MISSIONS_DATA.find((m) => m.id === selectedId) || MISSIONS_DATA[0];

  const envMeta = ENV_META[activeMission.environment] || ENV_META.industrial;

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col p-6 overflow-hidden">
      {/* Header */}
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
              <Crosshair className="w-6 h-6 text-cyan-400" />
              戰役任務作戰圖 (CAMPAIGN THEATERS)
            </h1>
            <p className="text-xs text-cyan-400/70">幽影特遣小隊戰略作戰情報 // 共 {MISSIONS_DATA.length} 個作戰行動節點</p>
          </div>
        </div>

        {/* Campaign Info Badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-orbitron text-cyan-400/70">DEPLOYMENT STATUS</div>
            <div className="text-xs font-mono font-bold text-cyan-200">READY FOR COMBAT</div>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 mt-6 min-h-0">
        {/* Left Column: Full Chapters List (Scrollable) */}
        <div className="col-span-5 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {MISSIONS_DATA.map((chapter) => {
            const isSelected = chapter.id === selectedId;
            const meta = ENV_META[chapter.environment] || ENV_META.industrial;
            const dangerStars = '★'.repeat(chapter.dangerLevel || 1) + '☆'.repeat(5 - (chapter.dangerLevel || 1));

            return (
              <button
                key={chapter.id}
                onClick={() => {
                  sound.playUiClick();
                  setSelectedId(chapter.id);
                }}
                className={`w-full text-left p-3.5 sci-btn transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_20px_rgba(0,210,255,0.25)]'
                    : 'bg-slate-900/60 border-cyan-500/20 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-orbitron font-bold text-sm tracking-wider text-cyan-300">
                    {chapter.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${meta.tagColor}`}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400/70 mb-2">
                  <span>{chapter.subTitle}</span>
                  <span className="text-amber-400 tracking-wider">威脅 {dangerStars}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 font-sans">
                  {chapter.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[10px] text-cyan-300/80 font-mono">
                  <span>目標目標：{chapter.targetCount} 機</span>
                  <span className="text-emerald-400">EXP +{chapter.rewards.exp}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Mission Detailed Dossier & Launch Button */}
        <div className="col-span-7 sci-box p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div>
            {/* Visual Banner from Concept Art */}
            <div className="relative h-52 rounded-lg overflow-hidden border border-cyan-500/40 shadow-xl mb-5">
              <img
                src={
                  activeMission.id % 2 === 0
                    ? '/assets/aistudio/_____________9e08efa2.png'
                    : '/assets/aistudio/_______________47390514.png'
                }
                alt="Mission Preview"
                className="w-full h-full object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-orbitron font-bold text-amber-400 uppercase tracking-widest">
                      ACTIVE THEATER
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${envMeta.tagColor}`}
                    >
                      {envMeta.icon}
                      {envMeta.label}
                    </span>
                  </div>
                  <h2 className="font-orbitron font-extrabold text-2xl text-white drop-shadow-[0_0_10px_rgba(0,210,255,0.6)]">
                    {activeMission.title}
                  </h2>
                </div>
                <div className="font-mono text-xs text-cyan-300 bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-500/30">
                  {activeMission.subTitle}
                </div>
              </div>
            </div>

            {/* Tactical Grid: Objectives & Composition */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Mission Objective */}
              <div>
                <div className="text-xs font-orbitron font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rotate-45 bg-amber-400" /> 主要任務目標
                </div>
                <p className="text-xs font-semibold text-slate-100 bg-slate-900/70 p-2.5 rounded border border-cyan-500/20 min-h-[58px]">
                  {activeMission.mainObjective}
                </p>
              </div>

              {/* Secondary Objective */}
              <div>
                <div className="text-xs font-orbitron font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rotate-45 bg-cyan-400" /> 可選次要目標
                </div>
                <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded border border-cyan-500/20 min-h-[58px]">
                  {activeMission.secondaryObjective}
                </p>
              </div>
            </div>

            {/* Enemy Composition Breakdown */}
            <div className="mb-4 bg-slate-900/60 p-3 rounded border border-cyan-500/20">
              <div className="text-xs font-orbitron font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-cyan-400" /> 偵測敵方兵力編制 (TARGET INTEL)
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {activeMission.enemyComposition.patrol ? (
                  <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    巡邏哨兵 x{activeMission.enemyComposition.patrol}
                  </span>
                ) : null}
                {activeMission.enemyComposition.assault ? (
                  <span className="px-2 py-1 rounded bg-slate-800 text-cyan-300 border border-cyan-700/50">
                    突擊獵殺機 x{activeMission.enemyComposition.assault}
                  </span>
                ) : null}
                {activeMission.enemyComposition.shield ? (
                  <span className="px-2 py-1 rounded bg-slate-800 text-blue-300 border border-blue-700/50">
                    力場護盾兵 x{activeMission.enemyComposition.shield}
                  </span>
                ) : null}
                {activeMission.enemyComposition.sniper ? (
                  <span className="px-2 py-1 rounded bg-red-950/60 text-red-400 border border-red-700/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                    暗影狙擊機 x{activeMission.enemyComposition.sniper}
                  </span>
                ) : null}
                {activeMission.enemyComposition.kamikaze ? (
                  <span className="px-2 py-1 rounded bg-orange-950/60 text-orange-400 border border-orange-700/60">
                    自爆爬行蛛機 x{activeMission.enemyComposition.kamikaze}
                  </span>
                ) : null}
                {activeMission.enemyComposition.stealth ? (
                  <span className="px-2 py-1 rounded bg-purple-950/60 text-purple-300 border border-purple-700/60">
                    光學迷彩幽靈機 x{activeMission.enemyComposition.stealth}
                  </span>
                ) : null}
                {activeMission.enemyComposition.support_medic ? (
                  <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                    奈米維修信標 x{activeMission.enemyComposition.support_medic}
                  </span>
                ) : null}
                {activeMission.enemyComposition.heavy ? (
                  <span className="px-2 py-1 rounded bg-slate-800 text-amber-300 border border-amber-700/50">
                    重裝執法者 x{activeMission.enemyComposition.heavy}
                  </span>
                ) : null}
                {activeMission.enemyComposition.boss ? (
                  <span className="px-2.5 py-1 rounded bg-red-950/80 text-red-300 border border-red-500 font-bold animate-pulse">
                    ⚠️ 首領級泰坦巨像 (APEX BOSS)
                  </span>
                ) : null}
              </div>
            </div>

            {/* Rewards */}
            <div className="mb-4">
              <div className="text-xs font-orbitron font-bold text-cyan-400 mb-2">
                預期任務報酬 (REWARDS)
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-cyan-500/30">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-orbitron text-cyan-200">
                    EXP +{activeMission.rewards.exp}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-amber-500/30">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-orbitron text-amber-200">
                    🪙 {activeMission.rewards.credits}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-emerald-500/30">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-orbitron text-emerald-200">
                    ⚙ {activeMission.rewards.materials}
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical Intel Radio Excerpt */}
            <div className="bg-slate-900/70 p-3 rounded border border-cyan-500/20 space-y-1.5">
              <div className="text-[10px] font-orbitron text-cyan-400/80 tracking-wider">
                COMMUNICATIONS BRIEFING // 通訊情報摘錄
              </div>
              {activeMission.briefing.map((line, idx) => (
                <div key={idx} className="text-xs text-slate-300 font-sans leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Launch Mission CTA */}
          <div className="mt-5 pt-3 border-t border-cyan-500/30">
            <button
              onClick={() => {
                sound.playUiClick();
                sound.playRadioBeep();
                onSelectMission(activeMission);
              }}
              className="w-full py-3.5 sci-btn bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-extrabold text-base tracking-widest shadow-[0_0_25px_#00f0ff] cursor-pointer flex items-center justify-center gap-2"
            >
              <Crosshair className="w-5 h-5" /> 部署出擊 (DEPLOY MISSION)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

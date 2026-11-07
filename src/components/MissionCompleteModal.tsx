import React, { useState } from 'react';
import { MissionChapter } from '../types/game';
import { sound } from '../utils/audio';
import { Award, CheckCircle, Clock, Target, Coins, Wrench, ShieldCheck, Flame, Cpu, Radio, RotateCcw } from 'lucide-react';

interface MissionCompleteModalProps {
  mission: MissionChapter;
  stats: {
    timeSeconds: number;
    shotsFired: number;
    shotsHit: number;
    enemiesKilled: number;
    totalEnemies: number;
    secondaryCompleted: boolean;
  };
  onNextMission: () => void;
  onReturnToArmory: () => void;
  onRestartMission?: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  mission,
  stats,
  onNextMission,
  onReturnToArmory,
  onRestartMission,
}) => {
  const [selectedEnding, setSelectedEnding] = useState<'destroy' | 'recalibrate' | 'expose' | null>(null);

  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 100;
  const minutes = Math.floor(stats.timeSeconds / 60);
  const seconds = stats.timeSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isFinalChapter = mission.environment === 'choice' || mission.id === 9;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="sci-box max-w-2xl w-full p-8 bg-slate-950/95 border border-cyan-400 shadow-[0_0_50px_rgba(0,210,255,0.4)] animate-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-orbitron mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> MISSION ACCOMPLISHED // 任務達成
          </div>
          <h1 className="font-orbitron font-extrabold text-3xl text-white tracking-widest drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]">
            {mission.title}
          </h1>
          <p className="text-xs font-chakra text-cyan-400/80 mt-1">幽影特遣部隊戰術結算簡報 (DEBRIEFING)</p>
        </div>

        {/* Chapter 5 Finale Choice if Applicable */}
        {isFinalChapter && (
          <div className="mb-6 p-4 rounded-lg border border-amber-500/40 bg-amber-950/20">
            <h3 className="font-orbitron font-bold text-amber-300 text-sm mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" /> 零界核心最終命運抉擇 (THE FINAL CHOICE)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              你站在失控的零界核心反應爐前，手中握著揭露軍火財閥與指揮官陰謀的解密金鑰。這座城市未來的命運由你按下確定鍵。
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setSelectedEnding('destroy');
                }}
                className={`p-3 rounded border text-left cursor-pointer transition-all ${
                  selectedEnding === 'destroy'
                    ? 'bg-red-950 border-red-400 text-red-100 shadow-[0_0_15px_#ef4444]'
                    : 'bg-slate-900 border-red-500/30 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Flame className="w-5 h-5 text-red-400 mb-1" />
                <div className="font-bold text-xs text-red-300 font-orbitron">摧毀核心</div>
                <div className="text-[10px] text-slate-400 mt-1">徹底引爆超導環，杜絕任何武器化可能。</div>
              </button>

              <button
                onClick={() => {
                  sound.playUiClick();
                  setSelectedEnding('recalibrate');
                }}
                className={`p-3 rounded border text-left cursor-pointer transition-all ${
                  selectedEnding === 'recalibrate'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-100 shadow-[0_0_15px_#00f0ff]'
                    : 'bg-slate-900 border-cyan-500/30 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-5 h-5 text-cyan-400 mb-1" />
                <div className="font-bold text-xs text-cyan-300 font-orbitron">重新校準</div>
                <div className="text-[10px] text-slate-400 mt-1">接管能源網，恢復全城供電並納入幽影守護。</div>
              </button>

              <button
                onClick={() => {
                  sound.playUiClick();
                  setSelectedEnding('expose');
                }}
                className={`p-3 rounded border text-left cursor-pointer transition-all ${
                  selectedEnding === 'expose'
                    ? 'bg-amber-950 border-amber-400 text-amber-100 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-slate-900 border-amber-500/30 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Radio className="w-5 h-5 text-amber-400 mb-1" />
                <div className="font-bold text-xs text-amber-300 font-orbitron">公開真相</div>
                <div className="text-[10px] text-slate-400 mt-1">將陰謀檔案廣播給全球自由通訊網，喚醒民眾。</div>
              </button>
            </div>

            {selectedEnding && (
              <div className="mt-3 p-3 bg-slate-900/90 rounded border border-cyan-500/30 text-xs text-cyan-200">
                {selectedEnding === 'destroy' && (
                  <div>
                    <span className="font-bold text-red-400">結局【灰燼重生】：</span>
                    凱恩引爆了反應爐冷卻棒。劇烈的藍色烈焰吞噬了巨環，城市從電磁奴役中解脫，凱恩與艾拉遁入荒野，成為新時代的守望者。
                  </div>
                )}
                {selectedEnding === 'recalibrate' && (
                  <div>
                    <span className="font-bold text-cyan-400">結局【新秩序守護者】：</span>
                    純淨的零界能源重新流經都市每座摩天大樓。凱恩接替指揮官掌握了特遣部隊，以鋼鐵意志守護封鎖區邊界。
                  </div>
                )}
                {selectedEnding === 'expose' && (
                  <div>
                    <span className="font-bold text-amber-400">結局【破曉之光】：</span>
                    巨幅全息投影在世界各大都市同時亮起，高層的貪婪與罪行昭然若揭。新的自由抵抗聯盟在凱恩的號召下誕生。
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* Time */}
          <div className="sci-box p-3 bg-slate-900/70 text-center">
            <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <div className="text-[10px] font-orbitron text-cyan-400/80">任務時間</div>
            <div className="font-orbitron font-bold text-base text-white mt-0.5">{timeFormatted}</div>
          </div>

          {/* Accuracy */}
          <div className="sci-box p-3 bg-slate-900/70 text-center">
            <Target className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-[10px] font-orbitron text-amber-400/80">射擊命中率</div>
            <div className="font-orbitron font-bold text-base text-white mt-0.5">{accuracy}%</div>
          </div>

          {/* Kills */}
          <div className="sci-box p-3 bg-slate-900/70 text-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-[10px] font-orbitron text-emerald-400/80">擊敗敵機</div>
            <div className="font-orbitron font-bold text-base text-white mt-0.5">
              {stats.enemiesKilled} / {stats.totalEnemies}
            </div>
          </div>

          {/* Secondary Target */}
          <div className="sci-box p-3 bg-slate-900/70 text-center">
            <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-[10px] font-orbitron text-purple-400/80">次要目標</div>
            <div className="font-orbitron font-bold text-xs text-purple-200 mt-1">
              {stats.secondaryCompleted ? '已達成' : '未達成'}
            </div>
          </div>
        </div>

        {/* Acquired Rewards */}
        <div className="sci-box p-4 bg-slate-900/80 mb-6 border border-cyan-500/30">
          <div className="text-xs font-orbitron text-cyan-300 font-bold mb-3">
            戰術資源收穫 (REWARDS EARNED)
          </div>
          <div className="flex justify-around items-center">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-[10px] text-cyan-400/70 font-mono">經驗值</div>
                <div className="font-orbitron font-bold text-sm text-cyan-200">
                  +{mission.rewards.exp} EXP
                </div>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-cyan-500/20" />
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-[10px] text-amber-400/70 font-mono">作戰信用點</div>
                <div className="font-orbitron font-bold text-sm text-amber-200">
                  +{mission.rewards.credits}
                </div>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-cyan-500/20" />
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-[10px] text-emerald-400/70 font-mono">改裝齒輪零件</div>
                <div className="font-orbitron font-bold text-sm text-emerald-200">
                  +{mission.rewards.materials}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {onRestartMission && (
            <button
              onClick={() => {
                sound.playUiClick();
                onRestartMission();
              }}
              className="py-3 px-4 sci-btn bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-orbitron font-bold text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" /> 重新開始
            </button>
          )}
          <button
            onClick={() => {
              sound.playUiClick();
              onReturnToArmory();
            }}
            className="flex-1 py-3 sci-btn bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs tracking-wider cursor-pointer"
          >
            前往武器改裝台
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              onNextMission();
            }}
            className="flex-1 py-3 sci-btn bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-sm tracking-wider cursor-pointer shadow-[0_0_20px_#00f0ff]"
          >
            {isFinalChapter ? '完成並選擇章節' : '下一階段作戰'}
          </button>
        </div>
      </div>
    </div>
  );
};

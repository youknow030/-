import React from 'react';
import { GameSettings } from '../types/game';
import { sound } from '../utils/audio';
import { Settings, Volume2, Sliders, Eye, X } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
  onQuitToMenu?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="sci-box max-w-xl w-full p-6 bg-slate-950/95 border border-cyan-400 shadow-[0_0_40px_rgba(0,210,255,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-extrabold text-lg text-cyan-100 tracking-wider">
              遊戲設定 (SYSTEM SETTINGS)
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="text-cyan-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs / Controls */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Mouse Sensitivity */}
          <div className="bg-slate-900/60 p-3 rounded border border-cyan-500/20">
            <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> 滑鼠靈敏度 (SENSITIVITY)
              </span>
              <span className="font-bold">{settings.mouseSensitivity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.05"
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Volume Settings */}
          <div className="bg-slate-900/60 p-3 rounded border border-cyan-500/20 space-y-3">
            <div className="text-xs font-orbitron text-cyan-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> 音量調節 (AUDIO VOLUMES)
            </div>

            {/* SFX */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>戰鬥射擊音效 (SFX)</span>
                <span>{Math.round(settings.volumeSfx * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volumeSfx}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ volumeSfx: val });
                  sound.setVolumes(settings.volumeMaster, val, settings.volumeBgm);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* BGM */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>環境氛圍音樂 (BGM)</span>
                <span>{Math.round(settings.volumeBgm * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volumeBgm}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ volumeBgm: val });
                  sound.setVolumes(settings.volumeMaster, settings.volumeSfx, val);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* FOV & Visuals */}
          <div className="bg-slate-900/60 p-3 rounded border border-cyan-500/20">
            <div className="flex justify-between text-xs font-orbitron text-cyan-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> 視野角度 (FIELD OF VIEW)
              </span>
              <span className="font-bold">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min="65"
              max="100"
              step="1"
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Controls Quick Reference Table */}
          <div className="bg-slate-900/80 p-3.5 rounded border border-cyan-500/30">
            <div className="text-xs font-orbitron text-cyan-300 mb-2 font-bold">
              操作按鍵表 (KEYBOARD / MOUSE CONTROLS)
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">W / A / S / D</span>
                <span>角色移動</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">滑鼠移動</span>
                <span>視角控制</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">滑鼠左鍵</span>
                <span>射擊開火</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">滑鼠右鍵</span>
                <span>瞄準鏡 (ADS)</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">Shift</span>
                <span>戰術奔跑</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">Space</span>
                <span>跳躍翻越</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">R</span>
                <span>更換彈匣</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 py-0.5">
                <span className="text-cyan-400 font-mono">1 / 2 / 3</span>
                <span>切換武器</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-cyan-500/30 flex items-center justify-between gap-3">
          {onQuitToMenu ? (
            <button
              onClick={() => {
                sound.playUiClick();
                onQuitToMenu();
              }}
              className="sci-btn px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 text-xs font-orbitron font-bold cursor-pointer"
            >
              放棄任務返回基地
            </button>
          ) : <div />}

          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="sci-btn px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs tracking-wider cursor-pointer shadow-[0_0_15px_#00f0ff]"
          >
            確認設定 (CONFIRM)
          </button>
        </div>
      </div>
    </div>
  );
};

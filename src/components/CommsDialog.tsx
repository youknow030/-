import React from 'react';
import { RadioCommsMessage } from '../types/game';
import { Radio, ShieldAlert } from 'lucide-react';

interface CommsDialogProps {
  message: RadioCommsMessage | null;
}

export const CommsDialog: React.FC<CommsDialogProps> = ({ message }) => {
  if (!message) return null;

  const isAira = message.sender === 'Aira';
  const isCommander = message.sender === 'Commander';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="sci-box p-3.5 border-l-4 border-l-cyan-400 bg-slate-950/90 backdrop-blur-md shadow-2xl flex items-start gap-3.5">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-cyan-400/50 bg-slate-900 flex items-center justify-center">
            {isAira ? (
              <img
                src="/assets/aistudio/_______________47390514.png"
                alt="Aira"
                className="w-full h-full object-cover object-bottom scale-150"
              />
            ) : isCommander ? (
              <div className="text-amber-400 font-bold text-lg flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-amber-400" />
              </div>
            ) : (
              <img
                src="/assets/aistudio/_____________9e08efa2.png"
                alt="Kane"
                className="w-full h-full object-cover object-top scale-125"
              />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded px-1 text-[8px] font-orbitron text-black font-bold">
            LIVE
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-orbitron font-bold text-xs tracking-wider text-cyan-300">
                {message.sender} // {message.senderTitle}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/60">FREQ 142.85 MHz</span>
          </div>

          <p className="mt-1 text-xs text-slate-200 leading-relaxed font-sans font-medium">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
};

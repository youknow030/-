import React, { useEffect, useRef } from 'react';
import { Enemy } from '../types/game';

interface RadarMapProps {
  playerPos: { x: number; z: number; angle: number };
  enemies: Enemy[];
  objectivePos?: { x: number; z: number };
}

export const RadarMap: React.FC<RadarMapProps> = ({ playerPos, enemies, objectivePos }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const radarSweepAngleRef = useRef(0);
  const dataRef = useRef({ playerPos, enemies, objectivePos });

  useEffect(() => {
    dataRef.current = { playerPos, enemies, objectivePos };
  }, [playerPos, enemies, objectivePos]);

  useEffect(() => {
    let animId: number;

    const render = () => {
      radarSweepAngleRef.current += 0.04;
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const { playerPos: pPos, enemies: ens, objectivePos: objPos } = dataRef.current;
      const size = canvas.width;
      const center = size / 2;
      const radius = size * 0.45;
      const radarScale = 2.2; // meters to radar pixels

      ctx.clearRect(0, 0, size, size);

      // Radar background circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 14, 25, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Range rings
      [0.35, 0.7, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(center, center, radius * ratio, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
        ctx.stroke();
      });

      // Cross grid
      ctx.beginPath();
      ctx.moveTo(center - radius, center);
      ctx.lineTo(center + radius, center);
      ctx.moveTo(center, center - radius);
      ctx.lineTo(center, center + radius);
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.18)';
      ctx.stroke();

      // Radar sweep cone
      const sweep = radarSweepAngleRef.current;
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
      gradient.addColorStop(1, 'rgba(0, 210, 255, 0.02)');

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, sweep - 0.4, sweep);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // North Indicator
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 10px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', center, center - radius + 14);

      // Render Enemies
      ens.forEach((enemy) => {
        if (enemy.hp <= 0) return;
        // Transform relative to player
        const dx = (enemy.x - pPos.x) * radarScale;
        const dz = (enemy.z - pPos.z) * radarScale;

        // Rotate by player angle
        const cos = Math.cos(-pPos.angle);
        const sin = Math.sin(-pPos.angle);
        const rx = dx * cos - dz * sin;
        const rz = dx * sin + dz * cos;

        // Clamp to radar radius
        const dist = Math.sqrt(rx * rx + rz * rz);
        if (dist <= radius - 4) {
          ctx.beginPath();
          ctx.arc(center + rx, center + rz, enemy.type === 'titan_boss' ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle =
            enemy.type === 'titan_boss'
              ? '#ff0055'
              : enemy.type === 'kamikaze'
              ? '#f97316'
              : enemy.type === 'support_medic'
              ? '#10b981'
              : enemy.type === 'stealth'
              ? '#a855f7'
              : '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Objective Marker (Gold Diamond)
      if (objPos) {
        const dx = (objPos.x - pPos.x) * radarScale;
        const dz = (objPos.z - pPos.z) * radarScale;
        const cos = Math.cos(-pPos.angle);
        const sin = Math.sin(-pPos.angle);
        const rx = dx * cos - dz * sin;
        const rz = dx * sin + dz * cos;
        const dist = Math.sqrt(rx * rx + rz * rz);

        const clampedDist = Math.min(dist, radius - 8);
        const factor = dist > 0 ? clampedDist / dist : 0;
        const ox = center + rx * factor;
        const oz = center + rz * factor;

        ctx.save();
        ctx.translate(ox, oz);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-3.5, -3.5, 7, 7);
        ctx.restore();
      }

      // Player Arrow at center
      ctx.beginPath();
      ctx.moveTo(center, center - 7);
      ctx.lineTo(center - 5, center + 6);
      ctx.lineTo(center, center + 3);
      ctx.lineTo(center + 5, center + 6);
      ctx.closePath();
      ctx.fillStyle = '#00f0ff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative p-1 rounded-xl sci-box border border-cyan-500/40">
      <canvas ref={canvasRef} width={130} height={130} className="rounded-full" />
      <div className="absolute top-1 left-2 text-[9px] font-orbitron tracking-widest text-cyan-400/80">
        RADAR 40M
      </div>
    </div>
  );
};

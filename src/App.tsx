/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { FPSGame } from './game/FPSGame';
import { MissionSelect } from './components/MissionSelect';
import { WeaponInspector } from './components/WeaponInspector';
import { CharacterSheet } from './components/CharacterSheet';
import { SettingsModal } from './components/SettingsModal';
import { INITIAL_WEAPONS, ATTACHMENTS_DATA } from './data/weaponsData';
import { MISSIONS_DATA } from './data/missionsData';
import { WeaponConfig, PlayerStats, GameSettings, MissionChapter } from './types/game';
import { sound } from './utils/audio';

export default function App() {
  const [currentView, setCurrentView] = useState<'menu' | 'game' | 'mission_select' | 'armory' | 'character_sheet'>('menu');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Persistent Player Progression
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    shield: 100,
    maxShield: 100,
    stamina: 100,
    maxStamina: 100,
    exp: 250,
    nextLevelExp: 1000,
    level: 3,
    credits: 3200,
    gears: 850, // Starting scrap gears to upgrade weapons right away!
  });

  // Weapons State
  const [weapons, setWeapons] = useState<WeaponConfig[]>(INITIAL_WEAPONS);
  const [currentWeaponIndex, setCurrentWeaponIndex] = useState(0);

  // Active Mission
  const [activeMission, setActiveMission] = useState<MissionChapter>(MISSIONS_DATA[0]);

  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1.0,
    invertY: false,
    volumeMaster: 0.8,
    volumeBgm: 0.35,
    volumeSfx: 0.8,
    fov: 75,
    crosshairColor: '#00f0ff',
    showFps: true,
    adsToggle: false,
  });

  // Handlers for Weapons
  const handleUpgradeWeapon = (weaponId: string) => {
    setWeapons((prev) =>
      prev.map((w) => {
        if (w.id === weaponId && playerStats.gears >= w.upgradeCost && w.currentLevel < w.maxLevel) {
          setPlayerStats((ps) => ({ ...ps, gears: ps.gears - w.upgradeCost }));
          return {
            ...w,
            currentLevel: w.currentLevel + 1,
            upgradeCost: Math.round(w.upgradeCost * 1.5),
          };
        }
        return w;
      })
    );
  };

  const handleUnlockWeapon = (weaponId: string) => {
    setWeapons((prev) =>
      prev.map((w) => {
        if (w.id === weaponId && playerStats.gears >= w.unlockCost && !w.unlocked) {
          setPlayerStats((ps) => ({ ...ps, gears: ps.gears - w.unlockCost }));
          return {
            ...w,
            unlocked: true,
          };
        }
        return w;
      })
    );
  };

  const handleEquipAttachment = (
    weaponId: string,
    slot: 'scope' | 'grip' | 'muzzle' | 'magazine',
    attId: string
  ) => {
    setWeapons((prev) =>
      prev.map((w) => {
        if (w.id === weaponId) {
          return {
            ...w,
            attachments: {
              ...w.attachments,
              [slot]: attId,
            },
          };
        }
        return w;
      })
    );
  };

  const handleSelectSkin = (weaponId: string, skinId: string) => {
    setWeapons((prev) =>
      prev.map((w) => {
        if (w.id === weaponId) {
          return {
            ...w,
            selectedSkin: skinId,
          };
        }
        return w;
      })
    );
  };

  // Mission Finished Handler
  const handleMissionFinished = (rewards: { exp: number; credits: number; materials: number }) => {
    setPlayerStats((prev) => {
      const newExp = prev.exp + rewards.exp;
      const levelUp = newExp >= prev.nextLevelExp;
      return {
        ...prev,
        exp: levelUp ? newExp - prev.nextLevelExp : newExp,
        level: levelUp ? prev.level + 1 : prev.level,
        nextLevelExp: levelUp ? Math.round(prev.nextLevelExp * 1.35) : prev.nextLevelExp,
        credits: prev.credits + rewards.credits,
        gears: prev.gears + rewards.materials,
      };
    });
  };

  // Next Mission in Campaign Handler
  const handleNextMission = () => {
    const currentIdx = MISSIONS_DATA.findIndex((m) => m.id === activeMission.id);
    if (currentIdx !== -1 && currentIdx < MISSIONS_DATA.length - 1) {
      setActiveMission(MISSIONS_DATA[currentIdx + 1]);
    } else {
      setCurrentView('mission_select');
    }
  };

  return (
    <div className="w-screen h-screen bg-[#050811] text-white overflow-hidden relative font-sans">
      {/* 1. Main Menu View */}
      {currentView === 'menu' && (
        <MainMenu
          onStartGame={() => setCurrentView('game')}
          onMissionSelect={() => setCurrentView('mission_select')}
          onArmory={() => setCurrentView('armory')}
          onCharacterSheet={() => setCurrentView('character_sheet')}
          onSettings={() => setIsSettingsOpen(true)}
          playerLevel={playerStats.level}
        />
      )}

      {/* 2. 3D First-Person Combat Gameplay */}
      {currentView === 'game' && (
        <FPSGame
          mission={activeMission}
          weapons={weapons}
          currentWeaponIndex={currentWeaponIndex}
          playerStats={playerStats}
          mouseSensitivity={settings.mouseSensitivity}
          fov={settings.fov}
          onUpdateStats={(newStats) => setPlayerStats((prev) => ({ ...prev, ...newStats }))}
          onSelectWeapon={(idx) => setCurrentWeaponIndex(idx)}
          onMissionFinished={handleMissionFinished}
          onBackToMenu={() => setCurrentView('menu')}
          onOpenArmory={() => setCurrentView('armory')}
          onNextMission={handleNextMission}
        />
      )}

      {/* 3. Mission / Chapter Select */}
      {currentView === 'mission_select' && (
        <MissionSelect
          onSelectMission={(mission) => {
            setActiveMission(mission);
            setCurrentView('game');
          }}
          onBack={() => setCurrentView('menu')}
        />
      )}

      {/* 4. Weapon Armory & 3D Upgrades */}
      {currentView === 'armory' && (
        <WeaponInspector
          weapons={weapons}
          currentWeaponIndex={currentWeaponIndex}
          playerGears={playerStats.gears}
          onSelectWeapon={(idx) => setCurrentWeaponIndex(idx)}
          onUpgradeWeapon={handleUpgradeWeapon}
          onUnlockWeapon={handleUnlockWeapon}
          onEquipAttachment={handleEquipAttachment}
          onSelectSkin={handleSelectSkin}
          onBack={() => setCurrentView('menu')}
        />
      )}

      {/* 5. Character Dossier & Artwork */}
      {currentView === 'character_sheet' && (
        <CharacterSheet onBack={() => setCurrentView('menu')} />
      )}

      {/* 6. Settings Modal Overlay */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

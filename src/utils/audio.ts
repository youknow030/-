/**
 * Zero Front Procedural Web Audio Engine
 * Zero external audio files needed - 100% procedural Web Audio synthesis
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number, bgm: number) {
    if (this.ctx && this.masterGain && this.sfxGain && this.bgmGain) {
      this.masterGain.gain.setTargetAtTime(master, this.ctx.currentTime, 0.05);
      this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
      this.bgmGain.gain.setTargetAtTime(bgm, this.ctx.currentTime, 0.05);
    }
  }

  // Gunshots
  public playGunshot(type: 'AR-09' | 'VX-7' | 'SR-12' | 'SG-4' | 'Pulse-X' | 'P-01') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === 'Pulse-X') {
      // Sci-fi high frequency plasma zap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
      return;
    }

    // Noise buffer for mechanical shot blast
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = type === 'SR-12' ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(type === 'SR-12' ? 1200 : type === 'VX-7' ? 2400 : 1800, now);

    // Punch sub oscillator
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    const subStartFreq = type === 'SR-12' ? 180 : type === 'SG-4' ? 160 : 120;
    subOsc.frequency.setValueAtTime(subStartFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + (type === 'SR-12' ? 0.35 : 0.15));

    const subGain = this.ctx.createGain();
    const duration = type === 'SR-12' ? 0.4 : type === 'SG-4' ? 0.35 : 0.18;
    subGain.gain.setValueAtTime(type === 'SR-12' ? 0.8 : 0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(type === 'SG-4' ? 0.9 : 0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(now);
    subOsc.start(now);
    noise.stop(now + duration + 0.05);
    subOsc.stop(now + duration + 0.05);
  }

  // Hit sound (tactical hit marker tick)
  public playHitMarker(isHeadshot: boolean = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isHeadshot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1760 : 880, now);
    osc.frequency.setValueAtTime(isHeadshot ? 2340 : 1320, now + 0.03);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Enemy destroyed explosion
  public playExplosion() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(80, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.65);
  }

  // Reload sound (mechanical clicks)
  public playReload() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Mag out click
    const click1 = (t: number, f: number) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.06);
    };

    click1(now, 500);          // Mag release
    click1(now + 0.5, 750);    // Insert fresh mag
    click1(now + 0.9, 1100);   // Bolt chambered
  }

  // Player hurt / shield hit
  public playPlayerHurt(isShieldBreak = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isShieldBreak ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isShieldBreak ? 320 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  // UI Beep (Tactical Click)
  public playUiClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.03);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Radio Incoming Beep (for Aira comms)
  public playRadioBeep() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [0, 0.07].forEach((delay, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 950 : 1350, now + delay);
      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
    });
  }

  // Footstep
  public playFootstep() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Energy shield impact / nanite pulse
  public playShieldHit() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Nanite repair beam hum
  public playNaniteHeal() {
    this.playShieldHit();
  }

  // Sci-Fi Ambient Synth Drone
  public startAmbientBgm() {
    if (this.isBgmPlaying) return;
    this.init();
    if (!this.ctx || !this.bgmGain) return;
    this.isBgmPlaying = true;

    const chords = [55, 82.4, 110, 164.8]; // Low cyber drone notes (A1, E2, A2, E3)
    this.bgmNodes = chords.map((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      // Low pass filter
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320 + idx * 60, this.ctx!.currentTime);

      gain.gain.setValueAtTime(0.06 / (idx + 1), this.ctx!.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start();
      return { osc, gain };
    });
  }

  public stopAmbientBgm() {
    this.bgmNodes.forEach(({ osc }) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.bgmNodes = [];
    this.isBgmPlaying = false;
  }
}

export const sound = new SoundEngine();

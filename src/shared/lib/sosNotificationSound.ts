import { unlockChatAudioOnInteraction } from "./chatNotificationSound";

let audioContext: AudioContext | null = null;

export function unlockSosAudioOnInteraction(): void {
  unlockChatAudioOnInteraction();
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx =
      window.AudioContext ||
      (
        window as unknown as {
          webkitAudioContext: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Ctx) return null;
    audioContext ??= new Ctx();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  durationSec: number,
  peakGain: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);
  osc.start(startAt);
  osc.stop(startAt + durationSec + 0.02);
}

/** Signal sonore d’alerte SOS (triple impulsion, distinct du chat). */
export function playSosNotificationSound(urgent = false): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const peak = urgent ? 0.18 : 0.14;
  const freqs = urgent ? [740, 988, 740] : [620, 820, 620];
  const gap = urgent ? 0.22 : 0.26;

  freqs.forEach((freq, index) => {
    playTone(ctx, freq, t + index * gap, 0.16, peak);
  });
}

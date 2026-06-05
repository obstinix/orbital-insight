// Uses browser's built-in Web Speech API — no API key, works offline



export function speak(text: string, options?: {
  rate?: number;   // 0.1–10, default 0.9
  pitch?: number;  // 0–2, default 1
  volume?: number; // 0–1, default 1
  voiceName?: string; // e.g. 'Google UK English Male'
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[TTS] Web Speech API not supported in this browser');
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate   = options?.rate   ?? 0.9;
  utterance.pitch  = options?.pitch  ?? 1.0;
  utterance.volume = options?.volume ?? 1.0;
  utterance.lang   = 'en-US';

  // Try to use a deep, cinematic voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    options?.voiceName
      ? v.name === options.voiceName
      : v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('alex')
  );
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

// List available voices (call after window load + voices:changed event)
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.getVoices();
  }
  return [];
}

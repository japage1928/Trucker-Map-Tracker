export type VoiceGender = "female" | "male";

const VOICE_SETTING_KEY = "trucker-buddy-voice-gender";

export function getVoiceGender(): VoiceGender {
  if (typeof window === "undefined") return "female";
  return (localStorage.getItem(VOICE_SETTING_KEY) as VoiceGender) || "female";
}

export function setVoiceGender(gender: VoiceGender): void {
  localStorage.setItem(VOICE_SETTING_KEY, gender);
}

export function getBestVoice(preferredGender: VoiceGender): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const englishVoices = voices.filter(
    (v) => v.lang.startsWith("en-") || v.lang === "en"
  );

  const femaleKeywords = ["female", "woman", "samantha", "victoria", "karen", "moira", "fiona", "susan", "zira", "hazel"];
  const maleKeywords = ["male", "man", "daniel", "alex", "tom", "david", "james", "guy", "mark", "fred"];

  const genderKeywords = preferredGender === "female" ? femaleKeywords : maleKeywords;

  const naturalVoiceKeywords = ["natural", "neural", "premium", "enhanced", "google", "microsoft"];
  
  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -1;

  for (const voice of englishVoices) {
    let score = 0;
    const nameLower = voice.name.toLowerCase();

    const matchesGender = genderKeywords.some((kw) => nameLower.includes(kw));
    if (matchesGender) score += 10;

    const isNatural = naturalVoiceKeywords.some((kw) => nameLower.includes(kw));
    if (isNatural) score += 5;

    if (!voice.localService) score += 2;

    if (voice.lang === "en-US") score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  if (bestVoice) return bestVoice;

  if (englishVoices.length > 0) {
    const usVoice = englishVoices.find((v) => v.lang === "en-US");
    return usVoice || englishVoices[0];
  }

  return voices[0] || null;
}

export async function speakText(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    rate?: number;
    pitch?: number;
  }
): Promise<void> {
  if (!("speechSynthesis" in window)) {
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 0.95;
  utterance.pitch = options?.pitch ?? 1;

  const gender = getVoiceGender();
  const voice = getBestVoice(gender);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = () => options?.onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if ("speechSynthesis" in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

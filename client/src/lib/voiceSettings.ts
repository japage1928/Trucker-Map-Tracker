export type VoiceGender = "female" | "male";

const VOICE_SETTING_KEY = "trucker-buddy-voice-gender";

const VOICE_MAP: Record<VoiceGender, string> = {
  female: "nova",
  male: "onyx",
};

export function getVoiceGender(): VoiceGender {
  if (typeof window === "undefined") return "female";
  return (localStorage.getItem(VOICE_SETTING_KEY) as VoiceGender) || "female";
}

export function setVoiceGender(gender: VoiceGender): void {
  localStorage.setItem(VOICE_SETTING_KEY, gender);
}

export function getOpenAIVoice(): string {
  const gender = getVoiceGender();
  return VOICE_MAP[gender];
}

let currentAudio: HTMLAudioElement | null = null;

export async function speakText(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
  }
): Promise<void> {
  stopSpeaking();

  try {
    const voice = getOpenAIVoice();
    
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      throw new Error("TTS request failed");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    
    currentAudio.onplay = () => options?.onStart?.();
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      options?.onEnd?.();
    };
    currentAudio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      options?.onEnd?.();
    };

    await currentAudio.play();
  } catch (error) {
    console.error("TTS error:", error);
    options?.onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

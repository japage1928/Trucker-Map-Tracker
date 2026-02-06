import { apiRequest } from '@/lib/queryClient';
import type { AiContext } from '@/lib/ai-context';
import { speakText, stopSpeaking } from '@/lib/voiceSettings';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'unavailable';

export type DrivingContext = AiContext;

export interface VoiceSessionCallbacks {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

const LISTEN_START_TONE = 880;
const LISTEN_STOP_TONE = 660;
const TRIPS_STORAGE_KEY = 'driver-trips';
const TRIPS_SYNC_EVENT = 'trips:update';

interface TripPlan {
  id: string;
  title: string;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  plannedDate?: string;
  distanceMiles?: number;
  etaMinutes?: number;
  notes?: string;
  tripType?: "business" | "personal";
  status?: "planned" | "active" | "completed";
  startedAt?: string;
  endedAt?: string;
  autoDetected?: boolean;
  createdAt: string;
}

function playTone(frequency: number, durationMs: number) {
  if (typeof window === 'undefined') return;
  const AudioContextImpl = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextImpl) return;

  const context = new AudioContextImpl();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + durationMs / 1000);
  oscillator.onended = () => {
    context.close();
  };
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function getCancelCommand(text: string) {
  const trimmed = text.trim().toLowerCase();
  return trimmed === 'cancel' || trimmed === 'stop' || trimmed === 'stop listening' || trimmed === 'never mind' || trimmed === 'nevermind';
}

function loadTrips(): TripPlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TripPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrips(trips: TripPlan[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  window.dispatchEvent(new Event(TRIPS_SYNC_EVENT));
}

function stripTripAction(text: string): string {
  if (!text) return text;
  return text.replace(/\n?TRIP_ACTION_JSON:[\s\S]*$/i, '').trim();
}

function extractTripAction(text: string) {
  const match = text.match(/TRIP_ACTION_JSON:\s*([\s\S]*)$/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function applyTripAction(action: any) {
  if (!action || typeof action !== 'object') return;
  const trips = loadTrips();

  if (action.action === 'trip.create' && action.payload) {
    const next: TripPlan = {
      ...action.payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveTrips([next, ...trips]);
    return;
  }

  if (action.action === 'trip.delete') {
    const id = action.id || trips.find((trip) => trip.title?.toLowerCase() === String(action.title || '').toLowerCase())?.id;
    if (!id) return;
    saveTrips(trips.filter((trip) => trip.id !== id));
    return;
  }

  if (action.action === 'trip.update' && action.payload) {
    const id = action.id || trips.find((trip) => trip.title?.toLowerCase() === String(action.title || '').toLowerCase())?.id;
    if (!id) return;
    const updated = trips.map((trip) =>
      trip.id === id ? { ...trip, ...action.payload } : trip
    );
    saveTrips(updated);
  }
}


async function readStreamingResponse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = JSON.parse(line.slice(6));
      if (payload.content) {
        fullResponse += payload.content;
      }
      if (payload.error) {
        throw new Error(payload.error);
      }
      if (payload.done) {
        return payload.fullContent || fullResponse;
      }
    }
  }

  return fullResponse;
}

export class TruckerAiVoiceSession {
  private recognition: any = null;
  private active = false;
  private listening = false;
  private speaking = false;
  private finalTranscript = '';
  private conversationId: number | null = null;
  private context: DrivingContext;
  private callbacks: VoiceSessionCallbacks;
  private abortController: AbortController | null = null;

  constructor(context: DrivingContext, callbacks: VoiceSessionCallbacks = {}) {
    this.context = context;
    this.callbacks = callbacks;
  }

  updateContext(context: DrivingContext) {
    this.context = context;
  }

  start() {
    if (this.active) {
      this.startListening();
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setState('unavailable');
      return;
    }

    this.active = true;
    this.setState('idle');
    this.startListening();
  }

  stop() {
    this.active = false;
    this.finalTranscript = '';
    this.abortController?.abort();
    this.abortController = null;
    this.stopRecognition();
    stopSpeaking();
    this.setState('idle');
  }

  destroy() {
    this.stop();
    this.recognition = null;
  }

  private setState(state: VoiceState) {
    this.callbacks.onStateChange?.(state);
  }

  private initRecognition() {
    if (this.recognition) return;
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;

    this.recognition = new SpeechRecognitionCtor();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }

      this.finalTranscript = fullTranscript;
      this.callbacks.onTranscript?.(fullTranscript);

      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.isFinal) {
        this.finalTranscript = fullTranscript.trim();
      }
    };

    this.recognition.onerror = () => {
      this.listening = false;
      this.setState('error');
    };

    this.recognition.onend = () => {
      this.listening = false;
      playTone(LISTEN_STOP_TONE, 120);

      if (!this.active) return;

      const transcript = this.finalTranscript.trim();
      this.finalTranscript = '';

      if (!transcript) {
        this.startListeningSoon();
        return;
      }

      if (getCancelCommand(transcript)) {
        this.stop();
        return;
      }

      this.handleTranscript(transcript);
    };
  }

  private startListening() {
    if (!this.active || this.speaking || this.listening) return;
    this.initRecognition();

    if (!this.recognition) {
      this.setState('unavailable');
      return;
    }

    this.listening = true;
    this.setState('listening');
    playTone(LISTEN_START_TONE, 120);

    try {
      this.recognition.start();
    } catch {
      this.listening = false;
      this.setState('error');
    }
  }

  private startListeningSoon() {
    if (!this.active) return;
    setTimeout(() => this.startListening(), 200);
  }

  private stopRecognition() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      this.recognition.abort?.();
    }
    this.listening = false;
  }

  private async ensureConversation() {
    if (this.conversationId) return;
    const response = await apiRequest('POST', '/api/trucker-chat/conversations', {
      title: 'Driving Session',
    });
    const data = await response.json();
    this.conversationId = data.id;
  }

  private async handleTranscript(transcript: string) {
    this.setState('processing');
    this.stopRecognition();

    try {
      await this.ensureConversation();
      if (!this.conversationId) throw new Error('Conversation unavailable');

      const body = {
        content: transcript,
        aiContext: this.context,
        userLocation: this.context.position,
      };

      this.abortController = new AbortController();
      const response = await fetch(`/api/trucker-chat/conversations/${this.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reply = await readStreamingResponse(response);

      this.abortController = null;
      await this.speakReply(reply || '');
    } catch (error: any) {
      this.abortController = null;
      this.callbacks.onError?.(error?.message || 'Voice session error');
      this.setState('error');
    }
  }

  private async speakReply(text: string) {
    if (!text) {
      this.startListeningSoon();
      return;
    }

    const tripAction = extractTripAction(text);
    if (tripAction) {
      applyTripAction(tripAction);
    }

    const spokenText = stripTripAction(text);
    if (!spokenText) {
      this.startListeningSoon();
      return;
    }

    this.setState('speaking');
    this.speaking = true;

    await speakText(spokenText, {
      onStart: () => {
        this.stopRecognition();
      },
      onEnd: () => {
        this.speaking = false;
        if (this.active) {
          this.startListeningSoon();
        } else {
          this.setState('idle');
        }
      },
      rate: this.context.drivingState === 'driving' ? 0.96 : 0.88,
    });
  }
}

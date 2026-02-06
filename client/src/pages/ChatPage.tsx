import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MicOff, Trash2, Plus, Bot, User, Loader2, Volume2, VolumeX, Square } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocations } from "@/hooks/use-locations";
import { processDrivingState, type POIInput } from "@core/driving-engine";
import { buildAiContext } from "@/lib/ai-context";
import { useHOSTracking } from "@/hooks/use-hos-tracking";
import { useTrips } from "@/hooks/use-trips";
import { fetchWeatherContext, getWeatherAlert } from "@/lib/weather-adapter";
import type { WeatherContext } from "@shared/weather-types";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userSpeedMph, setUserSpeedMph] = useState<number | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const { data: locations } = useLocations();
  const { hos } = useHOSTracking();
  const { trips, addTrip, removeTrip, updateTrip } = useTrips();
  const [weatherContext, setWeatherContext] = useState<WeatherContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('truckerBuddy_autoSpeak');
      if (saved === 'true') setAutoSpeak(true);
    }
  }, []);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const pendingVoiceInputRef = useRef<string>("");
  const shouldAutoSendRef = useRef<boolean>(false);
  const sendMessageRef = useRef<((msg?: string) => void) | null>(null);
  const queryClient = useQueryClient();

  const speak = (text: string, messageId?: number) => {
    import('@/lib/voiceSettings').then(({ speakText }) => {
      speakText(text, {
        onStart: () => {
          setIsSpeaking(true);
          if (messageId) setSpeakingMessageId(messageId);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
      });
    });
  };

  const stopSpeakingHandler = () => {
    import('@/lib/voiceSettings').then(({ stopSpeaking }) => {
      stopSpeaking();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    });
  };

  const toggleAutoSpeak = () => {
    const newValue = !autoSpeak;
    setAutoSpeak(newValue);
    localStorage.setItem('truckerBuddy_autoSpeak', String(newValue));
  };

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setUserSpeedMph(
            typeof pos.coords.speed === "number" ? pos.coords.speed * 2.237 : null
          );
        },
        () => console.log("Location permission denied")
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!userLocation) return;

    fetchWeatherContext(userLocation.lat, userLocation.lng).then((context) => {
      if (cancelled || !context) return;
      const alert = getWeatherAlert(context);
      setWeatherContext({ ...context, alert });
    });

    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch {
          recognitionRef.current.stop?.();
        }
      }
    };
  }, []);

  // Setup speech recognition with auto-send
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        // Accumulate full transcript from all results
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setInput(fullTranscript);
        pendingVoiceInputRef.current = fullTranscript;
        
        // Check if the last result is final (user stopped speaking)
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal && fullTranscript.trim()) {
          shouldAutoSendRef.current = true;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-send if we have pending voice input and got a final result
        if (shouldAutoSendRef.current && pendingVoiceInputRef.current.trim()) {
          const messageToSend = pendingVoiceInputRef.current.trim();
          shouldAutoSendRef.current = false;
          pendingVoiceInputRef.current = "";
          // Small delay to ensure state is updated, then send directly
          setTimeout(() => {
            if (messageToSend) {
              sendMessageRef.current?.(messageToSend);
            }
          }, 50);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/trucker-chat/conversations"],
  });

  // Fetch active conversation with messages
  const { data: activeConversation } = useQuery<Conversation>({
    queryKey: ["/api/trucker-chat/conversations", activeConversationId],
    enabled: !!activeConversationId,
  });

  // Create new conversation
  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trucker-chat/conversations", { title: "New Chat" });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucker-chat/conversations"] });
      setActiveConversationId(data.id);
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/trucker-chat/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucker-chat/conversations"] });
      if (conversations.length > 1) {
        setActiveConversationId(conversations.find((c) => c.id !== activeConversationId)?.id || null);
      } else {
        setActiveConversationId(null);
      }
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingContent]);

  const stripTripAction = (text: string) => {
    if (!text) return text;
    return text.replace(/\n?TRIP_ACTION_JSON:[\s\S]*$/i, "").trim();
  };

  const extractTripAction = (text: string) => {
    const match = text.match(/TRIP_ACTION_JSON:\s*([\s\S]*)$/i);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  };

  const applyTripAction = (action: any) => {
    if (!action || typeof action !== "object") return;
    if (action.action === "trip.create" && action.payload) {
      addTrip(action.payload);
      return;
    }
    if (action.action === "trip.delete") {
      const id = action.id || trips.find((trip) => trip.title?.toLowerCase() === String(action.title || "").toLowerCase())?.id;
      if (id) removeTrip(id);
      return;
    }
    if (action.action === "trip.update" && action.payload) {
      const id = action.id || trips.find((trip) => trip.title?.toLowerCase() === String(action.title || "").toLowerCase())?.id;
      if (id) updateTrip(id, action.payload);
    }
  };

  // Send message with streaming
  const sendMessage = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input;
    if (!messageToSend.trim() || !activeConversationId || isStreaming) return;

    const userMessage = messageToSend.trim();
    setInput("");
    pendingVoiceInputRef.current = "";
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/trucker-chat/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage, userLocation, aiContext }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedContent += data.content;
                setStreamingContent((prev) => prev + data.content);
              }
              if (data.done) {
                const fullResponse = data.fullContent || accumulatedContent;
                const tripAction = extractTripAction(fullResponse);
                if (tripAction) {
                  applyTripAction(tripAction);
                }
                const displayResponse = stripTripAction(fullResponse);
                setIsStreaming(false);
                setStreamingContent("");
                queryClient.invalidateQueries({ queryKey: ["/api/trucker-chat/conversations", activeConversationId] });
                if (autoSpeak && displayResponse) {
                  setTimeout(() => speak(displayResponse), 100);
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
    }
  };

  // Keep sendMessage ref updated for voice auto-send
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  const toggleVoice = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const messages = activeConversation?.messages || [];
  const streamingDisplay = stripTripAction(streamingContent);

  const stopsAhead = useMemo(() => {
    if (!userLocation || !locations) return [];

    const pois: POIInput[] = locations
      .filter((loc) => loc.pins && loc.pins.length > 0)
      .map((loc) => {
        const pin = loc.pins[0];
        const lat = parseFloat(pin.lat);
        const lng = parseFloat(pin.lng);
        return {
          id: loc.id,
          name: loc.name,
          lat,
          lng,
          category: loc.facilityKind,
          address: loc.address,
          hoursOfOperation: loc.hoursOfOperation || undefined,
          notes: loc.notes,
        };
      })
      .filter((poi) => !isNaN(poi.lat) && !isNaN(poi.lng));

    const engineResult = processDrivingState({
      position: {
        lat: userLocation.lat,
        lng: userLocation.lng,
        heading: null,
        speed: null,
      },
      pois,
      options: {
        maxDistanceMiles: 50,
        coneAngleDegrees: 360,
        maxResults: 8,
      },
    });

    return engineResult.poisAhead;
  }, [locations, userLocation]);

  const aiContext = useMemo(() => {
    return buildAiContext({
      speedMph: userSpeedMph,
      position: userLocation,
      upcomingPois: stopsAhead.map((poi) => ({
        name: poi.name,
        distanceMiles: poi.distanceMiles,
        facilityKind: poi.category,
      })),
      hos: hos || undefined,
      weather: weatherContext || undefined,
      trips,
    });
  }, [stopsAhead, userLocation, userSpeedMph, hos, weatherContext, trips]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary" />
            Trucker Buddy AI
          </h1>
          <p className="text-muted-foreground">Your AI co-pilot on the road</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            onClick={toggleAutoSpeak}
            size="sm"
            variant={autoSpeak ? "default" : "outline"}
            title={autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          {isSpeaking && (
            <Button onClick={stopSpeakingHandler} size="sm" variant="destructive" title="Stop speaking">
              <Square className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={() => createConversation.mutate()} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            New Chat
          </Button>
          {activeConversationId && (
            <Button
              onClick={() => deleteConversation.mutate(activeConversationId)}
              size="sm"
              variant="outline"
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversation tabs */}
      {conversations.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {conversations.slice(0, 5).map((conv) => (
            <Button
              key={conv.id}
              variant={activeConversationId === conv.id ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setActiveConversationId(conv.id)}
            >
              {conv.title.slice(0, 20)}
              {conv.title.length > 20 && "..."}
            </Button>
          ))}
        </div>
      )}

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Bot className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Hey driver!</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              I'm your AI co-pilot. Ask me about truck stops, HOS rules, parking availability, route planning, or
              anything else you need on the road.
            </p>
            <Button onClick={() => createConversation.mutate()}>
              <Plus className="w-4 h-4 mr-2" />
              Start a Conversation
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && !streamingContent && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Ask me anything! Examples:</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>"How many hours can I drive today?"</li>
                      <li>"Find truck stops with showers near me"</li>
                      <li>"What are the scale house rules in Florida?"</li>
                      <li>"Best route for an oversize load to Texas"</li>
                    </ul>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {msg.role === "assistant" ? stripTripAction(msg.content) : msg.content}
                      </p>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => speakingMessageId === msg.id ? stopSpeakingHandler() : speak(stripTripAction(msg.content), msg.id)}
                          className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <Square className="w-3 h-3" /> Stop
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" /> Listen
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming message */}
                {streamingDisplay && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                      <p className="whitespace-pre-wrap">{streamingDisplay}</p>
                    </div>
                  </div>
                )}

                {isStreaming && !streamingContent && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-muted">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Button
                  type="button"
                  variant={isListening ? "default" : "outline"}
                  size="icon"
                  onClick={toggleVoice}
                  disabled={!recognitionRef.current}
                  className={isListening ? "animate-pulse" : ""}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Trucker Buddy..."
                  disabled={isStreaming}
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isStreaming}>
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              {userLocation && (
                <p className="text-xs text-muted-foreground mt-2">
                  Location shared for personalized recommendations
                </p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

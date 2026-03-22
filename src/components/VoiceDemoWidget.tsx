import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const sampleMessages = [
  { role: "user" as const, text: "Hi, I need help with my subscription." },
  { role: "bot" as const, text: "Of course! I can help you manage your subscription. What would you like to do — upgrade, downgrade, or cancel?" },
  { role: "user" as const, text: "I'd like to upgrade to the Pro plan." },
  { role: "bot" as const, text: "Great choice! I've upgraded your account to the Pro plan. You'll now have access to unlimited voice minutes and priority support. Is there anything else?" },
];

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const VoiceDemoWidget = () => {
  const [messages, setMessages] = useState<typeof sampleMessages>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputText, setInputText] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (currentIdx < sampleMessages.length) {
      const delay = currentIdx === 0 ? 1000 : 1800;
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, sampleMessages[currentIdx]]);
        if (sampleMessages[currentIdx].role === "user") setIsListening(true);
        setTimeout(() => setIsListening(false), 600);
        setCurrentIdx((i) => i + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentIdx]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const speechSynthesisSupported = "speechSynthesis" in window;
    const maybeRecognition = (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!maybeRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Typing still works.");
      return;
    }

    if (!speechSynthesisSupported) {
      setVoiceError("Text-to-speech is not supported in this browser.");
    }

    const recognition = new maybeRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) {
        setInputText(transcript);
        setVoiceError("");
      }
    };

    recognition.onerror = () => {
      setVoiceError("Could not capture voice input. Please try again or type your message.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: inputText }]);
    setInputText("");
    setTimeout(() => {
      const responseText = "Thanks for your message! This is a demo — in a live setup, our AI would respond in real-time.";
      setMessages((prev) => [...prev, { role: "bot", text: responseText }]);
      speakText(responseText);
    }, 1200);
  };

  const handleVoiceCapture = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Speech recognition is unavailable. Please type your message.");
      return;
    }

    setVoiceError("");
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="w-full max-w-md mx-auto glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-glow" />
        <span className="text-sm font-heading font-medium text-foreground">VoxAI Assistant</span>
        <span className="text-xs text-muted-foreground ml-auto">Live Demo</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-72 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-3 bg-primary rounded-full"
                  animate={{ scaleY: [1, 1.8, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
            Listening...
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-primary hover:bg-primary/10"
          onClick={handleVoiceCapture}
          aria-label="Start voice input"
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Type or speak..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            aria-label="Message input"
          />
        </div>
        <Button size="icon" variant="ghost" className="shrink-0 text-primary" onClick={handleSend} aria-label="Send message">
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {voiceError ? <div className="px-3 pb-3 text-xs text-muted-foreground">{voiceError}</div> : null}
    </div>
  );
};

export default VoiceDemoWidget;

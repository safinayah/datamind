import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, Send, Loader2, Zap, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── UUID helper ───────────────────────────────────────────────────────────────
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateSessionId(): string {
  const key = "ayah_chat_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

type Tone = "professional" | "conversational" | "technical";
type Message = { role: "user" | "assistant"; content: string; id: string };

const TONE_OPTIONS: { value: Tone; label: string; desc: string }[] = [
  { value: "conversational", label: "Conversational", desc: "Friendly & approachable" },
  { value: "professional", label: "Professional", desc: "Formal & structured" },
  { value: "technical", label: "Technical", desc: "Deep & precise" },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId());
  const [tone, setTone] = useState<Tone>("conversational");
  const [toneSelected, setToneSelected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startSession = trpc.chat.startSession.useMutation();
  const sendMessage = trpc.chat.send.useMutation();
  const { data: statusData } = trpc.chat.status.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchOnWindowFocus: false }
  );
  const { data: historyData } = trpc.chat.history.useQuery(
    { sessionId },
    { enabled: !!sessionId && isOpen, refetchOnWindowFocus: false }
  );

  // Load history on open
  useEffect(() => {
    if (historyData && historyData.length > 0 && messages.length === 0) {
      setMessages(historyData.map(m => ({ role: m.role as "user" | "assistant", content: m.content, id: String(m.id) })));
      setToneSelected(true);
    }
  }, [historyData]);

  // Sync remaining count
  useEffect(() => {
    if (statusData) {
      setRemaining(statusData.remaining);
      if (!statusData.allowed) setLimitReached(true);
    }
  }, [statusData]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && toneSelected) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, toneSelected]);

  const handleToneSelect = async (selectedTone: Tone) => {
    setTone(selectedTone);
    setToneSelected(true);
    try {
      await startSession.mutateAsync({ sessionId, tone: selectedTone });
      setMessages([{
        role: "assistant",
        content: `Hi! I'm DataMind AI — your data consulting platform. Ask me anything about data architecture, governance, cloud costs, ETL pipelines, quality frameworks, and more. What can I help you with?`,
        id: "welcome",
      }]);
    } catch {
      toast.error("Failed to start session. Please try again.");
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || limitReached) return;

    const userMsg: Message = { role: "user", content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendMessage.mutateAsync({ sessionId, message: text });

      if (result.limitReached) {
        setLimitReached(true);
        setShowUpgrade(true);
        setRemaining(0);
      } else if (result.reply) {
        const assistantMsg: Message = { role: "assistant", content: result.reply, id: (Date.now() + 1).toString() };
        setMessages(prev => [...prev, assistantMsg]);
        setRemaining(result.remaining);
        if (result.remaining === 1) {
          toast.info("1 free message remaining. Upgrade to continue chatting!", { duration: 4000 });
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-900/40 flex items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="Ask DataMind AI Anything About Data"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}

      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">D</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">DataMind AI</p>
              <p className="text-xs text-slate-400">Architecture · Governance · Cloud · CDMP</p>
            </div>

          </div>

          {/* Tone selector */}
          {!toneSelected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <div className="text-center mb-2">
                <p className="text-white font-semibold mb-1">How would you like to chat?</p>
                <p className="text-slate-400 text-sm">Choose a conversation style</p>
              </div>
              {TONE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleToneSelect(opt.value)}
                  disabled={startSession.isPending}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 hover:border-violet-500/50 transition-all text-left group"
                >
                  <p className="text-white font-medium text-sm group-hover:text-violet-300 transition-colors">{opt.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-slate-800 text-slate-200 border border-white/5 rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-white/5 px-3 py-2 rounded-2xl rounded-bl-sm">
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="p-3 border-t border-white/10 bg-slate-800/50">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about data..."
                    rows={1}
                    className="flex-1 bg-slate-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 resize-none focus:outline-none focus:border-violet-500/50 max-h-24 overflow-y-auto"
                    style={{ minHeight: "40px" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition flex-shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Send, Paperclip, X, Plus, MessageSquare, Trash2, Edit2,
  Check, ChevronLeft, Loader2, Image, FileText, Music, Video,
  Database, Cpu, Cloud, BookOpen, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import MermaidDiagram from "@/components/MermaidDiagram";

// ── Types ─────────────────────────────────────────────────────────────────────
type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaName?: string | null;
  createdAt: Date;
};

type Conversation = {
  id: number;
  title: string;
  tone: "professional" | "conversational" | "technical";
  createdAt: Date;
  updatedAt: Date;
};

// ── Choice Parser ─────────────────────────────────────────────────────────────
/**
 * Detects if an AI message ends with a question that has numbered or lettered options.
 * Returns the options array if found, or null if not.
 */
function parseChoices(content: string): string[] | null {
  const lines = content.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const choicePattern = /^([1-9A-Fa-f][.)\s])\s*(.+)$/;
  const choices: string[] = [];
  for (const line of lines) {
    const match = line.match(choicePattern);
    if (match) choices.push(match[2].trim());
  }
  if (choices.length >= 2 && choices.length <= 6 && content.includes("?")) return choices;
  return null;
}

// ── Message Bubble (with interactive choices) ───────────────────────────────────────
type MessageBubbleProps = {
  msg: Message;
  isLastAssistant: boolean;
  userName?: string;
  onChoiceSelect: (choice: string) => void;
};
function MessageBubble({ msg, isLastAssistant, userName, onChoiceSelect }: MessageBubbleProps) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");
  const choices = isLastAssistant ? parseChoices(msg.content) : null;
  return (
    <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      {msg.role === "assistant" && (
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">D</span>
        </div>
      )}
      <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          msg.role === "user"
            ? "bg-violet-600 text-white rounded-br-sm"
            : "bg-slate-800 text-slate-200 border border-white/5 rounded-bl-sm"
        }`}>
          {msg.role === "assistant" ? (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-white prose-code:text-violet-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
                    const code = String(children).replace(/\n$/, "");
                    if (lang === "mermaid") {
                      return <MermaidDiagram code={code} />;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  pre({ children }) {
                    // If child is a mermaid diagram, render without <pre> wrapper
                    return <>{children}</>;
                  },
                }}
              >{msg.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>
        {/* Interactive choice chips — only on last assistant message */}
        {choices && (
          <div className="mt-2 flex flex-col gap-2 w-full">
            <div className="flex flex-wrap gap-2">
              {choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => onChoiceSelect(choice)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/25 hover:border-violet-400/60 transition-all cursor-pointer text-left"
                >
                  {choice}
                </button>
              ))}
              <button
                onClick={() => setShowOtherInput(v => !v)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-600 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all cursor-pointer"
              >
                Other...
              </button>
            </div>
            {showOtherInput && (
              <div className="flex gap-2 mt-1">
                <input
                  autoFocus
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && otherText.trim()) {
                      onChoiceSelect(otherText.trim());
                      setOtherText("");
                      setShowOtherInput(false);
                    }
                  }}
                  placeholder="Type your own answer..."
                  className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
                />
                <button
                  onClick={() => {
                    if (otherText.trim()) {
                      onChoiceSelect(otherText.trim());
                      setOtherText("");
                      setShowOtherInput(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}
        {msg.mediaUrl && (
          <MediaPreview url={msg.mediaUrl} type={msg.mediaType} name={msg.mediaName} />
        )}
        <span className="text-[10px] text-slate-600 mt-1 px-1">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {msg.role === "user" && (
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">
            {userName?.charAt(0).toUpperCase() ?? "U"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Media Preview ─────────────────────────────────────────────────────────────
function MediaPreview({ url, type, name }: { url: string; type?: string | null; name?: string | null }) {
  if (!url) return null;
  if (type?.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={url} alt={name ?? "attachment"} className="max-w-xs max-h-48 rounded-lg border border-white/10 object-cover hover:opacity-90 transition" />
      </a>
    );
  }
  if (type?.startsWith("audio/")) {
    return (
      <div className="mt-2">
        <audio controls src={url} className="max-w-xs rounded-lg" />
        {name && <p className="text-xs text-slate-400 mt-1">{name}</p>}
      </div>
    );
  }
  if (type?.startsWith("video/")) {
    return (
      <div className="mt-2">
        <video controls src={url} className="max-w-xs max-h-48 rounded-lg border border-white/10" />
        {name && <p className="text-xs text-slate-400 mt-1">{name}</p>}
      </div>
    );
  }
  // PDF or other file
  const icon = type === "application/pdf" ? <FileText className="w-4 h-4 text-red-400" /> : <FileText className="w-4 h-4 text-slate-400" />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 mt-2 px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg hover:bg-slate-700 transition max-w-xs">
      {icon}
      <span className="text-xs text-slate-300 truncate">{name ?? "attachment"}</span>
    </a>
  );
}

// ── File type icon helper ─────────────────────────────────────────────────────
function fileIcon(type: string) {
  if (type.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />;
  if (type.startsWith("audio/")) return <Music className="w-4 h-4 text-purple-400" />;
  if (type.startsWith("video/")) return <Video className="w-4 h-4 text-pink-400" />;
  return <FileText className="w-4 h-4 text-slate-400" />;
}

// ── Tone badge ────────────────────────────────────────────────────────────────
const TONE_LABELS = { professional: "Professional", conversational: "Conversational", technical: "Technical" };

// ── Main Chat Page ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const conversationId = id ? parseInt(id, 10) : null;

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Chat state
  const [input, setInput] = useState("");
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated, conversationId]);

  // tRPC queries
  const { data: conversations, refetch: refetchConversations } = trpc.conversations.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: messages, refetch: refetchMessages } = trpc.conversations.messages.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId && isAuthenticated }
  );

  // Sync messages from server
  useEffect(() => {
    if (messages) {
      setLocalMessages(messages as Message[]);
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, sending]);

  // Mutations
  const createConv = trpc.conversations.create.useMutation({
    onSuccess: (conv) => {
      refetchConversations();
      navigate(`/chat/${conv.id}`);
    },
  });

  const renameConv = trpc.conversations.rename.useMutation({
    onSuccess: () => { refetchConversations(); setEditingId(null); },
  });

  const deleteConv = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      refetchConversations();
      navigate("/chat");
    },
  });

  const sendMessage = trpc.conversations.send.useMutation();

  const updateTone = trpc.conversations.updateTone.useMutation({
    onSuccess: () => {
      refetchConversations();
      toast.success("Mode updated");
    },
  });
  const [showTonePicker, setShowTonePicker] = useState(false);

  // Handle file upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 16MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPendingMedia({ url: data.url, type: data.mediaType, name: data.mediaName });
      toast.success("File attached!");
    } catch {
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

   // Direct send — used by choice chips to bypass the input state timing issue
  const sendDirect = useCallback(async (text: string) => {
    if (!text.trim() || sending || !conversationId) return;
    setSending(true);
    const optimisticUser: Message = { id: Date.now(), role: "user", content: text, createdAt: new Date() };
    setLocalMessages(prev => [...prev, optimisticUser]);
    setInput("");
    try {
      const result = await sendMessage.mutateAsync({ conversationId, message: text });
      setLocalMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: result.reply, createdAt: new Date() }]);
      refetchConversations();
    } catch {
      toast.error("Failed to send message. Please try again.");
      setLocalMessages(prev => prev.filter(m => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [sending, conversationId, sendMessage, refetchConversations]);

  // Handle send
  const handleSend = useCallback(async () => {
    if ((!input.trim() && !pendingMedia) || sending || !conversationId) return;
    const msgText = input.trim() || (pendingMedia ? `[Attached: ${pendingMedia.name}]` : "");
    setSending(true);

    // Optimistic update
    const optimisticUser: Message = {
      id: Date.now(),
      role: "user",
      content: msgText,
      mediaUrl: pendingMedia?.url,
      mediaType: pendingMedia?.type,
      mediaName: pendingMedia?.name,
      createdAt: new Date(),
    };
    setLocalMessages(prev => [...prev, optimisticUser]);
    setInput("");
    setPendingMedia(null);

    try {
      const result = await sendMessage.mutateAsync({
        conversationId,
        message: msgText,
        mediaUrl: optimisticUser.mediaUrl ?? undefined,
        mediaType: optimisticUser.mediaType ?? undefined,
        mediaName: optimisticUser.mediaName ?? undefined,
      });

      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: result.reply,
        createdAt: new Date(),
      };
      setLocalMessages(prev => [...prev, assistantMsg]);
      refetchConversations(); // update updatedAt order in sidebar
    } catch {
      toast.error("Failed to send message. Please try again.");
      setLocalMessages(prev => prev.filter(m => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, pendingMedia, sending, conversationId, sendMessage, refetchConversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // New conversation
  const handleNewConversation = () => {
    createConv.mutate({ title: "New Conversation", tone: "conversational" });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  const currentConv = conversations?.find(c => c.id === conversationId);

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden">
      {/* ── Mobile overlay backdrop ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div className={`${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } fixed md:relative md:translate-x-0 z-30 md:z-auto ${
        sidebarOpen ? "md:w-72" : "md:w-0"
      } w-72 h-full flex-shrink-0 transition-all duration-300 overflow-hidden border-r border-white/5 bg-slate-900 md:bg-slate-900/80 flex flex-col`}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">DataMind <span className="text-violet-400">AI</span></span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            disabled={createConv.isPending}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/5"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Back to home */}
        <div className="px-3 py-2 border-b border-white/5">
          <a href="/dashboard" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition text-xs">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </a>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {!conversations || conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs px-4">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No conversations yet.</p>
              <p>Click + to start one.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition ${
                  conv.id === conversationId
                    ? "bg-violet-600/20 border border-violet-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
                onClick={() => navigate(`/chat/${conv.id}`)}
              >
                {editingId === conv.id ? (
                  <input
                    className="flex-1 bg-slate-700 border border-violet-500/50 rounded px-2 py-0.5 text-xs text-white outline-none"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") renameConv.mutate({ id: conv.id, title: editTitle });
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-xs text-slate-300 truncate">{conv.title}</span>
                )}

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  {editingId === conv.id ? (
                    <button
                      onClick={e => { e.stopPropagation(); renameConv.mutate({ id: conv.id, title: editTitle }); }}
                      className="p-1 rounded hover:bg-white/10 text-emerald-400"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm("Delete this conversation?")) deleteConv.mutate({ id: conv.id });
                    }}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* User info at bottom */}
        {user && (
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <a href="/profile" className="text-slate-500 hover:text-slate-300 transition">
                <MoreHorizontal className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Chat Area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-white/5 bg-slate-900/50 flex items-center gap-3 px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentConv?.title ?? (conversationId ? "Loading..." : "Select a conversation")}
            </p>
          </div>
          <div className="flex items-center gap-2 relative">
            {/* Tone switcher */}
            {currentConv && (
              <div className="relative">
                <button
                  onClick={() => setShowTonePicker(p => !p)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full text-xs text-slate-300 transition select-none"
                  title="Switch conversation mode"
                >
                  <span>{TONE_LABELS[currentConv.tone]}</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showTonePicker && (
                  <>
                    {/* backdrop to close on outside click */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowTonePicker(false)} />
                    <div className="absolute right-0 top-9 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[170px]">
                      <p className="px-4 pt-3 pb-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Response Mode</p>
                      {(["professional", "conversational", "technical"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            if (currentConv && t !== currentConv.tone) {
                              updateTone.mutate({ id: currentConv.id, tone: t });
                            }
                            setShowTonePicker(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition flex items-center justify-between ${
                            currentConv.tone === t
                              ? "bg-violet-600/20 text-violet-300 font-medium"
                              : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{TONE_LABELS[t]}</span>
                          {currentConv.tone === t && <span className="text-violet-400 text-sm">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 rounded-full">
              <Cpu className="w-3 h-3 text-violet-400" />
              <span className="text-xs text-violet-300 font-medium">Data AI</span>
            </div>
          </div>
        </div>

        {/* No conversation selected */}
        {!conversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-6">
              <Database className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ask DataMind AI Anything About Data</h2>
            <p className="text-slate-400 text-sm max-w-md mb-8">
              Get expert answers on data architecture, ETL pipelines, cloud costs, data governance, and more. Upload files, diagrams, or schemas for analysis.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full mb-8">
              {[
                { icon: <Database className="w-4 h-4" />, text: "Data Architecture" },
                { icon: <Cloud className="w-4 h-4" />, text: "Cloud Cost Optimization" },
                { icon: <BookOpen className="w-4 h-4" />, text: "Data Governance" },
                { icon: <Cpu className="w-4 h-4" />, text: "ETL & Pipelines" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-xs text-slate-400">
                  <span className="text-violet-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
            <Button
              onClick={handleNewConversation}
              disabled={createConv.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6"
            >
              {createConv.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Start New Conversation
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {localMessages.length === 0 && !sending && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-slate-400 text-sm">Start the conversation — ask anything about data.</p>
                  <p className="text-slate-600 text-xs mt-1">You can also attach images, PDFs, audio, or video files.</p>
                </div>
              )}

              {localMessages.map((msg, msgIdx) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isLastAssistant={msg.role === "assistant" && msgIdx === localMessages.length - 1 && !sending}
                  userName={user?.name ?? undefined}
                  onChoiceSelect={(choice) => sendDirect(choice)}
                />
              ))}

              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <div className="px-4 py-3 bg-slate-800 border border-white/5 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-white/5 bg-slate-900/50 flex-shrink-0">
              {/* Pending media preview */}
              {pendingMedia && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl">
                  {fileIcon(pendingMedia.type)}
                  <span className="text-xs text-slate-300 flex-1 truncate">{pendingMedia.name}</span>
                  <button onClick={() => setPendingMedia(null)} className="text-slate-500 hover:text-red-400 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end bg-slate-800 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-violet-500/50 transition">
                {/* File attach button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-white/5 transition flex-shrink-0 self-end mb-0.5"
                  title="Attach file (image, PDF, audio, video — max 16MB)"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about data architecture, ETL, cloud costs, governance..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none max-h-32 overflow-y-auto py-1"
                  style={{ minHeight: "24px" }}
                />

                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !pendingMedia) || sending || uploading}
                  className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex-shrink-0 self-end mb-0.5"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-600 text-center mt-2">
                Supports images, PDFs, audio &amp; video · Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,audio/*,video/*,text/plain,text/csv,.xlsx,.xls,.docx,.doc"
        onChange={handleFileSelect}
      />
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Plus, ExternalLink, Trash2, ChevronRight,
  LogOut, User, BookOpen, Cpu, Cloud, BarChart3, Database,
  Loader2, ArrowUpRight, Layers, Zap, Shield, Clock, FileBarChart2,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TONE_COLORS: Record<string, string> = {
  professional: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  conversational: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  technical: "bg-violet-500/10 text-violet-300 border-violet-500/20",
};

// Icon map for DB-driven topics
const ICON_MAP: Record<string, React.ReactNode> = {
  Database: <Database className="w-4 h-4" />,
  Cloud: <Cloud className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  ArrowUpRight: <ArrowUpRight className="w-4 h-4" />,
};

const TOPIC_COLORS = [
  "from-blue-600/20 to-blue-800/10 border-blue-500/20 hover:border-blue-400/40",
  "from-cyan-600/20 to-cyan-800/10 border-cyan-500/20 hover:border-cyan-400/40",
  "from-violet-600/20 to-violet-800/10 border-violet-500/20 hover:border-violet-400/40",
  "from-emerald-600/20 to-emerald-800/10 border-emerald-500/20 hover:border-emerald-400/40",
  "from-amber-600/20 to-amber-800/10 border-amber-500/20 hover:border-amber-400/40",
  "from-rose-600/20 to-rose-800/10 border-rose-500/20 hover:border-rose-400/40",
];

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: profile, isLoading: profileLoading } = trpc.auth.getProfile.useQuery();
  const { data: conversations, isLoading: convsLoading, refetch } = trpc.conversations.list.useQuery();
  const { data: dbTopics } = trpc.topics.list.useQuery();
  const { data: myReports, isLoading: reportsLoading } = trpc.dataImpact.myReports.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("ayah_user");
      toast.success("Signed out.");
      // Use full page reload to clear all in-memory auth state and tRPC cache
      window.location.href = "/";
    },
  });

  const createConv = trpc.conversations.create.useMutation({
    onSuccess: (conv) => {
      refetch();
      navigate(`/chat/${conv.id}`);
    },
    onError: () => toast.error("Failed to create conversation."),
  });

  const deleteConv = trpc.conversations.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Conversation deleted."); setDeletingId(null); },
    onError: () => { toast.error("Failed to delete."); setDeletingId(null); },
  });

  const handleNewChat = (topic?: string, topicRule?: string) => {
    createConv.mutate({ title: topic ?? "New Conversation", tone: "conversational", ...(topicRule ? { topicRule } : {}) });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Delete this conversation? This cannot be undone.")) {
      setDeletingId(id);
      deleteConv.mutate({ id });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!profile) {
    navigate("/login");
    return null;
  }

  const recentConvs = conversations?.slice(0, 5) ?? [];
  const totalConvs = conversations?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: logo + portfolio link */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">D</span>
              </div>
              <span className="text-base font-bold text-white">DataMind <span className="text-violet-400">AI</span></span>
            </a>
          </div>

          {/* Right: user info + sign out */}
          <div className="flex items-center gap-3">
            {profile.role === "admin" && (
              <Link href="/admin">
                <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              </Link>
            )}
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold select-none">
                {getInitials(profile.name)}
              </div>
              <span className="text-sm text-slate-300 hidden sm:block">{profile.name}</span>
            </Link>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-slate-500 hover:text-slate-300 transition p-1.5 rounded-lg hover:bg-white/5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {profile.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-slate-500 text-sm">
            Your personal data consulting workspace — ask anything, upload files, explore insights.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {[
            { icon: <MessageSquare className="w-4 h-4 text-violet-400" />, label: "Conversations", value: totalConvs.toString(), sub: "total chats" },
            { icon: <Zap className="w-4 h-4 text-cyan-400" />, label: "Unlimited", value: "∞", sub: "messages" },
            { icon: <Clock className="w-4 h-4 text-emerald-400" />, label: "Last Active", value: recentConvs[0] ? timeAgo(recentConvs[0].updatedAt) : "—", sub: "most recent chat" },
          ].map(stat => (
            <Card key={stat.label} className="bg-white/[0.03] border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-xs text-slate-500">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-600 mt-0.5">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: recent conversations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                Recent Conversations
              </h2>
              <div className="flex items-center gap-2">
                <Link href="/impact">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 h-8 text-xs px-3 bg-transparent"
                  >
                    <FileBarChart2 className="w-3.5 h-3.5 mr-1" />New Report
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => handleNewChat()}
                  disabled={createConv.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs px-3"
                >
                  {createConv.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><Plus className="w-3.5 h-3.5 mr-1" />New Chat</>
                  }
                </Button>
              </div>
            </div>

            {convsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </div>
            ) : recentConvs.length === 0 ? (
              <Card className="bg-white/[0.03] border-white/5 border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-1">No conversations yet</p>
                  <p className="text-slate-600 text-xs mb-4">Pick a topic below to start your first data consulting session</p>
                  <Button size="sm" onClick={() => handleNewChat()} className="bg-violet-600 hover:bg-violet-700 text-white">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Start a Conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentConvs.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-violet-500/30 hover:bg-violet-600/5 cursor-pointer transition"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{conv.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${TONE_COLORS[conv.tone] ?? TONE_COLORS.conversational}`}>
                          {conv.tone}
                        </span>
                        <span className="text-[10px] text-slate-500">{timeAgo(conv.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={e => { e.stopPropagation(); window.open(`/chat/${conv.id}`, "_blank"); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-white/5 transition"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => handleDelete(e, conv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition"
                        title="Delete"
                        disabled={deletingId === conv.id}
                      >
                        {deletingId === conv.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition flex-shrink-0" />
                  </div>
                ))}

                {totalConvs > 5 && (
                  <Link href="/chat">
                    <button className="w-full text-center text-xs text-slate-500 hover:text-violet-400 transition py-2">
                      View all {totalConvs} conversations →
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right column: impact reports + quick-start topics + profile card */}
          <div className="space-y-4">
            {/* My Impact Reports */}
            <Card className="bg-white/[0.03] border-white/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <FileBarChart2 className="w-4 h-4 text-cyan-400" />
                    My Impact Reports
                  </CardTitle>
                  <Link href="/impact">
                    <button className="text-[10px] text-slate-500 hover:text-cyan-400 transition">+ New</button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {reportsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /></div>
                ) : !myReports || myReports.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500 mb-2">No reports yet</p>
                    <Link href="/impact">
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-7 px-3">
                        Generate Report
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myReports.slice(0, 4).map(report => (
                      <Link key={report.id} href={`/impact/report/${report.shareToken}`}>
                        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-600/5 cursor-pointer transition group">
                          <div className="w-7 h-7 rounded-md bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileBarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate group-hover:text-cyan-300 transition">{report.title || report.industry || "Unnamed Report"}</p>
                            <p className="text-[10px] text-slate-500">{timeAgo(report.createdAt)}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition flex-shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                    {myReports.length > 4 && (
                      <Link href="/impact">
                        <button className="w-full text-center text-[10px] text-slate-500 hover:text-cyan-400 transition py-1">
                          View all {myReports.length} reports →
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Quick-start topics */}
            <Card className="bg-white/[0.03] border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Quick Start Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {(!dbTopics || dbTopics.length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-3">No topics configured yet.</p>
                ) : (
                  dbTopics.map((topic, idx) => (
                    <button
                      key={topic.id}
                      onClick={() => handleNewChat(topic.title, topic.aiRule ?? undefined)}
                      disabled={createConv.isPending}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r ${TOPIC_COLORS[idx % TOPIC_COLORS.length]} border transition text-left`}
                    >
                      <div className="text-slate-300 flex-shrink-0">{ICON_MAP[topic.icon] ?? <MessageSquare className="w-4 h-4" />}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{topic.title}</p>
                        {topic.subtitle && <p className="text-[10px] text-slate-500 truncate">{topic.subtitle}</p>}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Profile mini-card */}
            <Card className="bg-white/[0.03] border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold select-none">
                    {getInitials(profile.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{profile.name}</p>
                    <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="w-full border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs h-8">
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      View Full Profile
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button variant="outline" size="sm" className="w-full border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs h-8">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                      About Ayah
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

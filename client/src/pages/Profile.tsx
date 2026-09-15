import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Shield, Calendar, Clock, LogOut, ArrowLeft, Database,
  MessageSquare, Plus, Trash2, ExternalLink, Loader2, ChevronRight,
  BookOpen, Cpu, Cloud, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
  return formatDate(date);
}

const TONE_COLORS: Record<string, string> = {
  professional: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  conversational: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  technical: "bg-violet-500/10 text-violet-300 border-violet-500/20",
};

// ── Conversations Dashboard ───────────────────────────────────────────────────
function ConversationsDashboard() {
  const [, navigate] = useLocation();
  const { data: conversations, isLoading, refetch } = trpc.conversations.list.useQuery();

  const createConv = trpc.conversations.create.useMutation({
    onSuccess: (conv) => {
      refetch();
      navigate(`/chat/${conv.id}`);
    },
    onError: () => toast.error("Failed to create conversation."),
  });

  const deleteConv = trpc.conversations.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Conversation deleted."); },
    onError: () => toast.error("Failed to delete conversation."),
  });

  const handleNew = () => {
    createConv.mutate({ title: "New Conversation", tone: "conversational" });
  };

  const handleOpen = (id: number) => {
    navigate(`/chat/${id}`);
  };

  const handleOpenNewTab = (id: number) => {
    window.open(`/chat/${id}`, "_blank");
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Delete this conversation? This cannot be undone.")) {
      deleteConv.mutate({ id });
    }
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            Data Consultant Chats
          </CardTitle>
          <Button
            size="sm"
            onClick={handleNew}
            disabled={createConv.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs px-3"
          >
            {createConv.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <><Plus className="w-3.5 h-3.5 mr-1" /> New Chat</>
            }
          </Button>
        </div>
        <p className="text-slate-500 text-xs mt-1">
          All your data consulting conversations — architecture, ETL, cloud costs, governance, and more.
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">No conversations yet</p>
            <p className="text-slate-600 text-xs mb-4">Start a chat to get expert data consulting advice</p>

            {/* Topic suggestions */}
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto mb-4">
              {[
                { icon: <Database className="w-3.5 h-3.5" />, text: "Data Architecture" },
                { icon: <Cloud className="w-3.5 h-3.5" />, text: "Cloud Costs" },
                { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Data Governance" },
                { icon: <Cpu className="w-3.5 h-3.5" />, text: "ETL Design" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/40 border border-white/5 rounded-lg text-xs text-slate-400">
                  <span className="text-violet-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleNew}
              disabled={createConv.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Start Your First Chat
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleOpen(conv.id)}
                className="group flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-violet-500/30 hover:bg-violet-600/5 cursor-pointer transition"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{conv.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${TONE_COLORS[conv.tone] ?? TONE_COLORS.conversational}`}>
                      {conv.tone}
                    </span>
                    <span className="text-[10px] text-slate-500">{timeAgo(conv.updatedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={e => { e.stopPropagation(); handleOpenNewTab(conv.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-white/5 transition"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => handleDelete(e, conv.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition flex-shrink-0" />
              </div>
            ))}

            {/* Open full chat view */}
            <div className="pt-2">
              <Link href="/chat">
                <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-400 hover:text-white hover:border-violet-500/50 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Open Full Chat Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function Profile() {
  const [, navigate] = useLocation();

  const { data: profile, isLoading, error } = trpc.auth.getProfile.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("ayah_user");
      toast.success("Signed out successfully.");
      window.location.href = "/";
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full text-center p-8">
          <p className="text-slate-300 mb-4">You need to be signed in to view your profile.</p>
          <Link href="/login">
            <Button className="bg-violet-600 hover:bg-violet-700">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const loginMethodLabel =
    profile.loginMethod === "google" ? "Google"
    : profile.loginMethod === "email" ? "Email & Password"
    : profile.loginMethod ?? "Unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header card */}
        <Card className="bg-slate-800/60 border-slate-700 mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-violet-600/40 via-cyan-600/30 to-slate-800" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-slate-800 select-none">
                {getInitials(profile.name)}
              </div>
              {profile.role === "admin" && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{profile.name ?? "No name set"}</h1>
            <p className="text-slate-400 text-sm flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {profile.email ?? "No email on file"}
            </p>
          </CardContent>
        </Card>

        {/* Account details */}
        <Card className="bg-slate-800/60 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { icon: <User className="w-4 h-4" />, label: "Full Name", value: profile.name ?? "—" },
              { icon: <Mail className="w-4 h-4" />, label: "Email Address", value: profile.email ?? "—" },
              {
                icon: <Database className="w-4 h-4" />, label: "Sign-in Method",
                value: (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-200">
                    {profile.loginMethod === "google" && <GoogleIcon />}
                    {loginMethodLabel}
                  </span>
                ),
              },
              { icon: <Calendar className="w-4 h-4" />, label: "Member Since", value: formatDate(profile.createdAt) },
              { icon: <Clock className="w-4 h-4" />, label: "Last Sign-in", value: formatDateTime(profile.lastSignedIn) },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? "border-b border-slate-700/60" : ""}`}>
                <div className="flex items-center gap-2 text-slate-400 text-sm">{row.icon}{row.label}</div>
                {typeof row.value === "string"
                  ? <span className="text-slate-200 text-sm font-medium">{row.value}</span>
                  : row.value
                }
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conversations Dashboard */}
        <ConversationsDashboard />

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400 transition"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}

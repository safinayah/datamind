import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  Plus, Trash2, Edit3, Check, X, MessageSquare, Settings,
  ArrowLeft, Loader2, Eye, ToggleLeft, ToggleRight, Users,
  FileText, Layout, ChevronDown, ChevronUp, Save, RefreshCw,
  BookOpen, ExternalLink, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Tab = "rules" | "conversations" | "testimonials" | "cms" | "topics" | "knowledge";

// Helper to get stored user
function getStoredUser() {
  try {
    const raw = localStorage.getItem("ayah_user");
    if (!raw) return null;
    return JSON.parse(raw) as { id: number; name: string | null; email: string | null; role: string };
  } catch {
    return null;
  }
}

// CMS Section editor component
function CMSSectionEditor({ section, items, onRefresh }: {
  section: string;
  items: Array<{ id: number; key: string; value: string; type: string; sortOrder: number }>;
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"text" | "list" | "url" | "boolean">("text");
  const [isExpanded, setIsExpanded] = useState(false);

  const updateMutation = trpc.cms.update.useMutation({
    onSuccess: () => { onRefresh(); setEditingId(null); toast.success("Content updated!"); },
    onError: () => toast.error("Failed to update content"),
  });
  const deleteMutation = trpc.cms.delete.useMutation({
    onSuccess: () => { onRefresh(); toast.success("Content deleted"); },
    onError: () => toast.error("Failed to delete content"),
  });
  const createMutation = trpc.cms.create.useMutation({
    onSuccess: () => { onRefresh(); setShowAddForm(false); setNewKey(""); setNewValue(""); toast.success("Content added!"); },
    onError: () => toast.error("Failed to add content"),
  });

  const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, " ");

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 hover:bg-slate-800 transition text-left"
      >
        <div className="flex items-center gap-3">
          <Layout className="w-4 h-4 text-purple-400" />
          <span className="text-white font-medium">{sectionLabel}</span>
          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">{items.length} items</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3 bg-slate-950/50">
          {items.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No content items yet. Add your first one.</p>
          )}
          {items.map(item => (
            <div key={item.id} className="p-3 rounded-lg border border-white/5 bg-slate-900">
              {editingId === item.id ? (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-mono">{item.key}</p>
                  {item.type === "text" || item.type === "list" ? (
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={item.type === "list" ? 4 : 2}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 resize-y focus:outline-none focus:border-purple-500/50"
                      placeholder={item.type === "list" ? "One item per line" : "Enter value"}
                    />
                  ) : (
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-purple-500/50"
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateMutation.mutate({ id: item.id, value: editValue })}
                      disabled={updateMutation.isPending}
                      size="sm" className="bg-purple-600 hover:bg-purple-700 gap-1"
                    >
                      {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                    </Button>
                    <Button onClick={() => setEditingId(null)} variant="outline" size="sm" className="border-white/10 text-slate-400">
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-mono text-purple-400">{item.key}</p>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">{item.type}</span>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-3">{item.value}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingId(item.id); setEditValue(item.value); }}
                      className="p-1.5 text-slate-400 hover:text-white transition rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${item.key}"?`)) deleteMutation.mutate({ id: item.id }); }}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new item */}
          {showAddForm ? (
            <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900">
              <p className="text-xs text-slate-400 mb-3 font-medium">Add new content item</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  placeholder="Key (e.g. title, subtitle)"
                  className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="text">text</option>
                  <option value="list">list</option>
                  <option value="url">url</option>
                  <option value="boolean">boolean</option>
                </select>
              </div>
              <textarea
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder={newType === "list" ? "One item per line" : "Enter value"}
                rows={2}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 mb-3 resize-none focus:outline-none focus:border-purple-500/50"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate({ section, key: newKey, value: newValue, type: newType, sortOrder: items.length })}
                  disabled={!newKey.trim() || !newValue.trim() || createMutation.isPending}
                  size="sm" className="bg-purple-600 hover:bg-purple-700 gap-1"
                >
                  {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm" className="border-white/10 text-slate-400">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-purple-400 border border-dashed border-white/10 hover:border-purple-500/30 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add item to {sectionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const storedUser = getStoredUser();
  const [activeTab, setActiveTab] = useState<Tab>("rules");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newRule, setNewRule] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const utils = trpc.useUtils();

  // Use Manus auth
  const { data: manusUser, isLoading: manusLoading } = trpc.auth.me.useQuery();

  // Determine the effective user (Manus OAuth or email/password)
  const effectiveUser = manusUser ?? storedUser;
  const isAdmin = effectiveUser?.role === "admin";
  const isAuthenticated = !!effectiveUser;
  const isLoading = manusLoading;

  // Queries
  const { data: rules, isLoading: rulesLoading } = trpc.admin.listRules.useQuery(undefined, { enabled: isAdmin });
  const { data: sessions, isLoading: sessionsLoading } = trpc.admin.listSessions.useQuery(undefined, { enabled: isAdmin && activeTab === "conversations" });
  const { data: conversation } = trpc.admin.getConversation.useQuery(
    { sessionId: selectedSession! },
    { enabled: !!selectedSession && isAdmin }
  );
  const { data: allContent, refetch: refetchContent } = trpc.cms.getAll.useQuery(undefined, { enabled: isAdmin && activeTab === "cms" });
  const { data: allTopics, refetch: refetchTopics } = trpc.topics.listAll.useQuery(undefined, { enabled: isAdmin && activeTab === "topics" });

  // Topic state
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [topicForm, setTopicForm] = useState({ title: "", subtitle: "", icon: "MessageSquare", aiRule: "", isActive: true, sortOrder: 0 });
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicForm, setNewTopicForm] = useState({ title: "", subtitle: "", icon: "MessageSquare", aiRule: "", isActive: true, sortOrder: 0 });

  const createTopic = trpc.topics.create.useMutation({
    onSuccess: () => { refetchTopics(); setShowNewTopicForm(false); setNewTopicForm({ title: "", subtitle: "", icon: "MessageSquare", aiRule: "", isActive: true, sortOrder: 0 }); toast.success("Topic created!"); },
    onError: () => toast.error("Failed to create topic"),
  });
  const updateTopic = trpc.topics.update.useMutation({
    onSuccess: () => { refetchTopics(); setEditingTopicId(null); toast.success("Topic updated!"); },
    onError: () => toast.error("Failed to update topic"),
  });
  const deleteTopic = trpc.topics.delete.useMutation({
    onSuccess: () => { refetchTopics(); toast.success("Topic deleted"); },
    onError: () => toast.error("Failed to delete topic"),
  });

  // Mutations
  const createRule = trpc.admin.createRule.useMutation({
    onSuccess: () => { utils.admin.listRules.invalidate(); setNewTitle(""); setNewRule(""); setShowNewForm(false); toast.success("Rule created!"); },
    onError: () => toast.error("Failed to create rule"),
  });
  const updateRule = trpc.admin.updateRule.useMutation({
    onSuccess: () => { utils.admin.listRules.invalidate(); setEditingRule(null); toast.success("Rule updated!"); },
    onError: () => toast.error("Failed to update rule"),
  });
  const deleteRule = trpc.admin.deleteRule.useMutation({
    onSuccess: () => { utils.admin.listRules.invalidate(); toast.success("Rule deleted"); },
    onError: () => toast.error("Failed to delete rule"),
  });
  const toggleRule = trpc.admin.updateRule.useMutation({
    onSuccess: () => utils.admin.listRules.invalidate(),
  });

  // Knowledge Base
  const { data: knowledgeArticles, refetch: refetchKnowledge } = trpc.knowledge.list.useQuery(undefined, { enabled: isAdmin && activeTab === "knowledge" });
  const [showNewArticleForm, setShowNewArticleForm] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [articleForm, setArticleForm] = useState({ title: "", topic: "", content: "", source: "", sourceUrl: "", isActive: true });
  const [newArticleForm, setNewArticleForm] = useState({ title: "", topic: "", content: "", source: "", sourceUrl: "", isActive: true });

  const createArticle = trpc.knowledge.create.useMutation({
    onSuccess: () => { refetchKnowledge(); setShowNewArticleForm(false); setNewArticleForm({ title: "", topic: "", content: "", source: "", sourceUrl: "", isActive: true }); toast.success("Article created and ingestion started!"); },
    onError: () => toast.error("Failed to create article"),
  });
  const updateArticle = trpc.knowledge.update.useMutation({
    onSuccess: () => { refetchKnowledge(); setEditingArticleId(null); toast.success("Article updated!"); },
    onError: () => toast.error("Failed to update article"),
  });
  const deleteArticle = trpc.knowledge.delete.useMutation({
    onSuccess: () => { refetchKnowledge(); toast.success("Article deleted"); },
    onError: () => toast.error("Failed to delete article"),
  });
  const reIngestArticle = trpc.knowledge.reIngest.useMutation({
    onSuccess: (data) => { refetchKnowledge(); toast.success(`Re-ingested: ${data.chunksCreated} chunks created`); },
    onError: () => toast.error("Re-ingestion failed"),
  });

  // Testimonials
  const { data: testimonials } = trpc.testimonials.adminList.useQuery(undefined, { enabled: isAdmin });
  const approveTestimonial = trpc.testimonials.approve.useMutation({ onSuccess: () => utils.testimonials.adminList.invalidate() });
  const deleteTestimonial = trpc.testimonials.delete.useMutation({ onSuccess: () => utils.testimonials.adminList.invalidate() });

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
      <Settings className="w-12 h-12 text-slate-600" />
      <h1 className="text-2xl font-bold">Admin Access Required</h1>
      <p className="text-slate-400">You need to be logged in as admin to view this page.</p>
      <div className="flex gap-3">
        <Link href="/login" className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-medium transition">
          Sign In
        </Link>
        <Link href="/" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition">
          Back to Home
        </Link>
      </div>
    </div>
  );

  // Group CMS content by section
  const contentBySections: Record<string, typeof allContent> = {};
  if (allContent) {
    for (const item of allContent) {
      if (!contentBySections[item.section]) contentBySections[item.section] = [];
      contentBySections[item.section]!.push(item);
    }
  }

  const tabs = [
    { id: "rules" as Tab, label: "Chat Rules", icon: <Settings className="w-4 h-4" /> },
    { id: "topics" as Tab, label: "Quick Topics", icon: <Layout className="w-4 h-4" /> },
    { id: "knowledge" as Tab, label: "Knowledge Base", icon: <BookOpen className="w-4 h-4" /> },
    { id: "cms" as Tab, label: "Page Content", icon: <FileText className="w-4 h-4" /> },
    { id: "conversations" as Tab, label: "Conversations", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "testimonials" as Tab, label: "Testimonials", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-white font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {effectiveUser?.name ?? effectiveUser?.email ?? "Admin"}
            </span>
            <button
              onClick={() => { localStorage.removeItem("ayah_user"); navigate("/"); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 pb-4 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Rules Tab ── */}
        {activeTab === "rules" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Chat Rules</h2>
                <p className="text-slate-400 text-sm mt-1">Rules that shape how the AI responds to visitors</p>
              </div>
              <Button onClick={() => setShowNewForm(true)} className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Plus className="w-4 h-4" /> Add Rule
              </Button>
            </div>

            {showNewForm && (
              <div className="mb-6 p-5 rounded-xl border border-violet-500/30 bg-slate-900">
                <h3 className="text-white font-medium mb-4">New Rule</h3>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Rule title (e.g. 'Availability')"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 mb-3 focus:outline-none focus:border-violet-500/50"
                />
                <textarea
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  placeholder="Describe the rule..."
                  rows={3}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 mb-4 resize-none focus:outline-none focus:border-violet-500/50"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createRule.mutate({ title: newTitle, rule: newRule, isActive: true })}
                    disabled={!newTitle.trim() || !newRule.trim() || createRule.isPending}
                    className="bg-violet-600 hover:bg-violet-700 gap-1"
                    size="sm"
                  >
                    {createRule.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </Button>
                  <Button onClick={() => setShowNewForm(false)} variant="outline" size="sm" className="border-white/10 text-slate-400">
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                </div>
              </div>
            )}

            {rulesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
            ) : rules?.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No rules yet. Add your first rule to shape how the AI responds.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules?.map(rule => (
                  <div key={rule.id} className={`p-4 rounded-xl border ${rule.isActive ? "border-white/10 bg-slate-900" : "border-white/5 bg-slate-900/50 opacity-60"}`}>
                    {editingRule === rule.id ? (
                      <div>
                        <input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-2 focus:outline-none focus:border-violet-500/50"
                        />
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 resize-none focus:outline-none focus:border-violet-500/50"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateRule.mutate({ id: rule.id, title: editTitle, rule: editContent })}
                            disabled={updateRule.isPending}
                            size="sm" className="bg-violet-600 hover:bg-violet-700 gap-1"
                          >
                            <Check className="w-3 h-3" /> Save
                          </Button>
                          <Button onClick={() => setEditingRule(null)} variant="outline" size="sm" className="border-white/10 text-slate-400">
                            <X className="w-3 h-3" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{rule.title}</p>
                          <p className="text-slate-400 text-sm mt-1">{rule.rule}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleRule.mutate({ id: rule.id, isActive: !rule.isActive })}
                            className="text-slate-400 hover:text-white transition"
                            title={rule.isActive ? "Deactivate" : "Activate"}
                          >
                            {rule.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => { setEditingRule(rule.id); setEditTitle(rule.title); setEditContent(rule.rule); }}
                            className="text-slate-400 hover:text-white transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this rule?")) deleteRule.mutate({ id: rule.id }); }}
                            className="text-slate-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CMS Tab ── */}
        {activeTab === "cms" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Page Content</h2>
                <p className="text-slate-400 text-sm mt-1">Edit all text, links, and content across your portfolio pages</p>
              </div>
              <Button onClick={() => refetchContent()} variant="outline" size="sm" className="border-white/10 text-slate-400 gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>

            {!allContent ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
            ) : Object.keys(contentBySections).length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No CMS content yet</p>
                <p className="text-sm">Content items will appear here once you add them via the sections below.</p>
                <p className="text-sm mt-4 text-slate-600">To seed initial content, use the "Add item" button within each section after expanding it.</p>
                {/* Quick-start: show a default section */}
                <div className="mt-8 max-w-lg mx-auto">
                  <CMSSectionEditor
                    section="hero"
                    items={[]}
                    onRefresh={() => refetchContent()}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show existing sections */}
                {Object.entries(contentBySections).map(([section, items]) => (
                  <CMSSectionEditor
                    key={section}
                    section={section}
                    items={items ?? []}
                    onRefresh={() => refetchContent()}
                  />
                ))}

                {/* Add new section */}
                <AddNewSectionButton onRefresh={() => refetchContent()} />
              </div>
            )}
          </div>
        )}

        {/* ── Conversations Tab ── */}
        {activeTab === "conversations" && (
          <div className="flex gap-6 h-[600px]">
            <div className="w-72 flex-shrink-0 overflow-y-auto space-y-2">
              <h2 className="text-lg font-bold text-white mb-4">Sessions ({sessions?.length ?? 0})</h2>
              {sessionsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-violet-400 animate-spin" /></div>
              ) : sessions?.length === 0 ? (
                <p className="text-slate-500 text-sm">No conversations yet.</p>
              ) : sessions?.map(s => (
                <button
                  key={s.sessionId}
                  onClick={() => setSelectedSession(s.sessionId)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedSession === s.sessionId
                      ? "border-violet-500/50 bg-violet-600/10"
                      : "border-white/10 bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  <p className="text-white text-sm font-medium truncate">{s.sessionId.slice(0, 8)}...</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">{s.tone}</span>
                    <span className="text-xs text-slate-500">{s.freeMessagesUsed} msgs</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
                </button>
              ))}
            </div>

            <div className="flex-1 rounded-xl border border-white/10 bg-slate-900 overflow-hidden flex flex-col">
              {!selectedSession ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Select a session to view the conversation</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversation?.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-200 border border-white/5 rounded-bl-sm"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-50 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Topics Tab ── */}
        {activeTab === "topics" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Quick Start Topics ({allTopics?.length ?? 0})</h2>
              <button
                onClick={() => setShowNewTopicForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> Add Topic
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-6">These topics appear as quick-start cards on the user dashboard. Each topic can have a custom AI rule that guides the conversation when selected.</p>

            {/* New topic form */}
            {showNewTopicForm && (
              <div className="mb-6 p-5 bg-slate-900 border border-violet-500/30 rounded-xl space-y-4">
                <h3 className="text-white font-semibold">New Topic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Title *</label>
                    <input value={newTopicForm.title} onChange={e => setNewTopicForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Data Architecture" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Subtitle</label>
                    <input value={newTopicForm.subtitle} onChange={e => setNewTopicForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. Schema design, modeling" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Icon (Lucide name)</label>
                    <input value={newTopicForm.icon} onChange={e => setNewTopicForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. Database, Cloud, Shield" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Sort Order</label>
                    <input type="number" value={newTopicForm.sortOrder} onChange={e => setNewTopicForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">AI Rule / System Instruction</label>
                  <textarea value={newTopicForm.aiRule} onChange={e => setNewTopicForm(f => ({ ...f, aiRule: e.target.value }))} placeholder="e.g. Focus on database design, schema modeling, normalization..." rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={newTopicForm.isActive} onChange={e => setNewTopicForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                    Active (visible to users)
                  </label>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => createTopic.mutate(newTopicForm)} disabled={!newTopicForm.title || createTopic.isPending} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition">
                    {createTopic.isPending ? "Creating..." : "Create Topic"}
                  </button>
                  <button onClick={() => setShowNewTopicForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Cancel</button>
                </div>
              </div>
            )}

            {/* Topics list */}
            {!allTopics || allTopics.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No topics yet. Click "Add Topic" to create the first one.</p>
            ) : (
              <div className="space-y-4">
                {allTopics.map(topic => (
                  <div key={topic.id} className={`p-5 rounded-xl border ${topic.isActive ? "border-white/10 bg-slate-900" : "border-white/5 bg-slate-900/50 opacity-60"}`}>
                    {editingTopicId === topic.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Title *</label>
                            <input value={topicForm.title} onChange={e => setTopicForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Subtitle</label>
                            <input value={topicForm.subtitle} onChange={e => setTopicForm(f => ({ ...f, subtitle: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Icon (Lucide name)</label>
                            <input value={topicForm.icon} onChange={e => setTopicForm(f => ({ ...f, icon: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Sort Order</label>
                            <input type="number" value={topicForm.sortOrder} onChange={e => setTopicForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">AI Rule / System Instruction</label>
                          <textarea value={topicForm.aiRule} onChange={e => setTopicForm(f => ({ ...f, aiRule: e.target.value }))} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={topicForm.isActive} onChange={e => setTopicForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                            Active
                          </label>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => updateTopic.mutate({ id: topic.id, ...topicForm })} disabled={updateTopic.isPending} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition">
                            <Save className="w-4 h-4 inline mr-1" />{updateTopic.isPending ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingTopicId(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-white font-semibold">{topic.title}</span>
                            {!topic.isActive && <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">Inactive</span>}
                            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full">icon: {topic.icon}</span>
                            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full">order: {topic.sortOrder}</span>
                          </div>
                          {topic.subtitle && <p className="text-slate-400 text-sm mb-2">{topic.subtitle}</p>}
                          {topic.aiRule && (
                            <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                              <p className="text-xs text-violet-400 font-medium mb-1">AI Rule:</p>
                              <p className="text-xs text-slate-400 leading-relaxed">{topic.aiRule}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => { setEditingTopicId(topic.id); setTopicForm({ title: topic.title, subtitle: topic.subtitle ?? "", icon: topic.icon, aiRule: topic.aiRule ?? "", isActive: topic.isActive, sortOrder: topic.sortOrder }); }}
                            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition" title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete topic "${topic.title}"?`)) deleteTopic.mutate({ id: topic.id }); }}
                            className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 transition" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Testimonials Tab ── */}
        {activeTab === "testimonials" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Testimonials ({testimonials?.length ?? 0})</h2>
            {testimonials?.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No testimonials yet.</p>
            ) : (
              <div className="space-y-4">
                {testimonials?.map(t => (
                  <div key={t.id} className={`p-5 rounded-xl border ${t.approved ? "border-emerald-500/20 bg-emerald-900/10" : "border-white/10 bg-slate-900"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {t.approved && <span className="text-xs px-2 py-0.5 bg-emerald-600/20 text-emerald-400 rounded-full border border-emerald-500/20">Approved</span>}
                          {t.isAnonymous && <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">Anonymous</span>}
                          {!t.isAnonymous && t.name && <span className="text-white font-medium text-sm">{t.name}</span>}
                          {t.role && <span className="text-slate-400 text-sm">{t.role}</span>}
                          {t.company && <span className="text-slate-500 text-sm">@ {t.company}</span>}
                        </div>
                        <p className="text-slate-300 text-sm">{t.content}</p>
                        <p className="text-xs text-slate-600 mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!t.approved && (
                          <button
                            onClick={() => approveTestimonial.mutate({ id: t.id })}
                            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm("Delete this testimonial?")) deleteTestimonial.mutate({ id: t.id }); }}
                          className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Knowledge Base Tab ── */}
        {activeTab === "knowledge" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-white">Knowledge Base</h2>
                <p className="text-slate-400 text-sm mt-1">Curated articles that ground the AI in trusted domain knowledge. Each article is chunked and embedded for semantic retrieval.</p>
              </div>
              <button
                onClick={() => setShowNewArticleForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> Add Article
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex gap-4 mb-6 mt-4">
              <div className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl">
                <span className="text-slate-400 text-xs">Total Articles</span>
                <p className="text-white font-bold text-lg">{knowledgeArticles?.length ?? 0}</p>
              </div>
              <div className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl">
                <span className="text-slate-400 text-xs">Total Chunks</span>
                <p className="text-white font-bold text-lg">{knowledgeArticles?.reduce((s, a) => s + (a.chunkCount ?? 0), 0) ?? 0}</p>
              </div>
              <div className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl">
                <span className="text-slate-400 text-xs">Active</span>
                <p className="text-white font-bold text-lg">{knowledgeArticles?.filter(a => a.isActive).length ?? 0}</p>
              </div>
            </div>

            {/* New article form */}
            {showNewArticleForm && (
              <div className="mb-6 p-5 bg-slate-900 border border-violet-500/30 rounded-xl space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-400" /> New Knowledge Article</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Title *</label>
                    <input value={newArticleForm.title} onChange={e => setNewArticleForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. DAMA-DMBOK Data Quality Dimensions" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Topic Tag *</label>
                    <input value={newArticleForm.topic} onChange={e => setNewArticleForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. data-quality, governance, etl" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Source *</label>
                    <input value={newArticleForm.source} onChange={e => setNewArticleForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. DAMA International (2017) — DMBOK v2" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Source URL</label>
                    <input value={newArticleForm.sourceUrl} onChange={e => setNewArticleForm(f => ({ ...f, sourceUrl: e.target.value }))} placeholder="https://..." className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Content * <span className="text-slate-600">(paste the article text, key facts, or structured knowledge)</span></label>
                  <textarea value={newArticleForm.content} onChange={e => setNewArticleForm(f => ({ ...f, content: e.target.value }))} placeholder="Paste the full article text, key excerpts, or structured knowledge here. The more detail, the better the AI retrieval quality." rows={8} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-y" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={newArticleForm.isActive} onChange={e => setNewArticleForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                    Active (included in AI retrieval)
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => createArticle.mutate(newArticleForm)}
                    disabled={!newArticleForm.title || !newArticleForm.topic || !newArticleForm.content || !newArticleForm.source || createArticle.isPending}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    {createArticle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {createArticle.isPending ? "Creating & Ingesting..." : "Create & Ingest"}
                  </button>
                  <button onClick={() => setShowNewArticleForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Cancel</button>
                </div>
              </div>
            )}

            {/* Articles list */}
            {!knowledgeArticles || knowledgeArticles.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 font-medium mb-2">No knowledge articles yet</p>
                <p className="text-slate-600 text-sm mb-4">Add your first article to start grounding the AI in trusted domain knowledge.</p>
                <button onClick={() => setShowNewArticleForm(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition">
                  Add First Article
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {knowledgeArticles.map(article => (
                  <div key={article.id} className={`p-5 rounded-xl border ${article.isActive ? "border-white/10 bg-slate-900" : "border-white/5 bg-slate-900/50 opacity-60"}`}>
                    {editingArticleId === article.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Title</label>
                            <input value={articleForm.title} onChange={e => setArticleForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Topic</label>
                            <input value={articleForm.topic} onChange={e => setArticleForm(f => ({ ...f, topic: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Source</label>
                            <input value={articleForm.source} onChange={e => setArticleForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Source URL</label>
                            <input value={articleForm.sourceUrl} onChange={e => setArticleForm(f => ({ ...f, sourceUrl: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Content</label>
                          <textarea value={articleForm.content} onChange={e => setArticleForm(f => ({ ...f, content: e.target.value }))} rows={8} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-y" />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={articleForm.isActive} onChange={e => setArticleForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                            Active
                          </label>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => updateArticle.mutate({ id: article.id, ...articleForm, sourceUrl: articleForm.sourceUrl || undefined })}
                            disabled={updateArticle.isPending}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                          >
                            {updateArticle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                          </button>
                          <button onClick={() => setEditingArticleId(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-white font-semibold">{article.title}</h3>
                              {!article.isActive && <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">Inactive</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="px-2 py-0.5 bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-full">{article.topic}</span>
                              <span>{article.source}</span>
                              {article.sourceUrl && (
                                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition">
                                  <ExternalLink className="w-3 h-3" /> Source
                                </a>
                              )}
                              <span className="text-slate-600">{article.chunkCount ?? 0} chunks</span>
                              <span className="text-slate-600">{new Date(article.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => reIngestArticle.mutate({ id: article.id })}
                              disabled={reIngestArticle.isPending && reIngestArticle.variables?.id === article.id}
                              className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition"
                              title="Re-ingest (rebuild embeddings)"
                            >
                              {reIngestArticle.isPending && reIngestArticle.variables?.id === article.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <RefreshCw className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => { setEditingArticleId(article.id); setArticleForm({ title: article.title, topic: article.topic, content: article.content, source: article.source, sourceUrl: article.sourceUrl ?? "", isActive: article.isActive ?? true }); }}
                              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`Delete "${article.title}"? This will also delete all its embeddings.`)) deleteArticle.mutate({ id: article.id }); }}
                              className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-3">{article.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for adding a new section
function AddNewSectionButton({ onRefresh }: { onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [firstKey, setFirstKey] = useState("");
  const [firstValue, setFirstValue] = useState("");

  const createMutation = trpc.cms.create.useMutation({
    onSuccess: () => { onRefresh(); setShowForm(false); setSectionName(""); setFirstKey(""); setFirstValue(""); toast.success("New section created!"); },
    onError: () => toast.error("Failed to create section"),
  });

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-500 hover:text-purple-400 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl transition"
      >
        <Plus className="w-4 h-4" /> Add New Section
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-900">
      <p className="text-white font-medium mb-3">Create New Section</p>
      <div className="space-y-2 mb-3">
        <input
          value={sectionName}
          onChange={e => setSectionName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
          placeholder="Section name (e.g. hero, services, about)"
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
        />
        <input
          value={firstKey}
          onChange={e => setFirstKey(e.target.value)}
          placeholder="First item key (e.g. title)"
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
        />
        <textarea
          value={firstValue}
          onChange={e => setFirstValue(e.target.value)}
          placeholder="First item value"
          rows={2}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => createMutation.mutate({ section: sectionName, key: firstKey, value: firstValue, type: "text", sortOrder: 0 })}
          disabled={!sectionName.trim() || !firstKey.trim() || !firstValue.trim() || createMutation.isPending}
          size="sm" className="bg-purple-600 hover:bg-purple-700 gap-1"
        >
          {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Create
        </Button>
        <Button onClick={() => setShowForm(false)} variant="outline" size="sm" className="border-white/10 text-slate-400">
          Cancel
        </Button>
      </div>
    </div>
  );
}

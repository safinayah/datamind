import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  ArrowRight, Bot, Brain, CheckCircle, ChevronRight, Cloud, Database,
  FileText, Layers, MessageSquare, Shield, Sparkles, Star, Upload, Zap,
  Calendar, Users, BarChart3, Lock, Github, Linkedin
} from "lucide-react";

// ── Contact Form ─────────────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const sendContact = trpc.contact.send.useMutation({
    onSuccess: () => setSubmitted(true),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    sendContact.mutate(form);
  };
  if (submitted) {
    return (
      <div className="text-center py-10">
        <CheckCircle className="w-12 h-12 text-violet-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Message sent!</h3>
        <p className="text-slate-400">We'll get back to you within 24 hours.</p>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <input
            type="text" required value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            type="email" required value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Subject</label>
        <input
          type="text" value={form.subject}
          onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
          placeholder="What's this about?"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Message</label>
        <textarea
          required rows={4} value={form.message}
          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
          placeholder="Tell me about your data challenge..."
        />
      </div>
      <Button
        type="submit" disabled={sendContact.isPending}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        {sendContact.isPending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { localStorage.clear(); window.location.href = "/"; },
  });

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Finance-First Data Intelligence",
      desc: "Get answers that connect data problems to business outcomes — revenue impact, audit risk, regulatory exposure, and decision quality. No jargon, no generic responses.",
      color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Financial Impact Reports",
      desc: "Quantify what a data problem is costing your organisation — with cited benchmarks, transparent formulas, and a CFO-ready summary you can take into a meeting.",
      color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Regulatory & Compliance Guidance",
      desc: "Understand your exposure under GDPR, SOX, BCBS 239, HIPAA, MiFID II, and DORA — with exact article citations and fine structures, not vague summaries.",
      color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Upload & Analyze",
      desc: "Share your reports, schema diagrams, CSV files, or architecture docs. The AI analyzes them and gives you insights framed around financial and business risk.",
      color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Focused Workspaces",
      desc: "Keep each topic in its own workspace — financial reporting integrity, compliance review, data strategy. Context stays clean and organised.",
      color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Book a 1-on-1 Session",
      desc: "Need a deeper dive? Book a direct consultation for data strategy, governance design, or building the business case for a data investment.",
      color: "from-rose-500/20 to-rose-600/10 border-rose-500/30",
    },
  ];

  const useCases = [
    { icon: <BarChart3 className="w-4 h-4" />, label: "Financial reporting data integrity" },
    { icon: <Shield className="w-4 h-4" />, label: "Regulatory risk & compliance (GDPR, SOX, BCBS 239)" },
    { icon: <Lock className="w-4 h-4" />, label: "Data security & breach economics" },
    { icon: <FileText className="w-4 h-4" />, label: "Data governance frameworks" },
    { icon: <Database className="w-4 h-4" />, label: "Data quality & audit readiness" },
    { icon: <Layers className="w-4 h-4" />, label: "Data asset valuation (Infonomics)" },
    { icon: <Cloud className="w-4 h-4" />, label: "Cloud & infrastructure cost analysis" },
    { icon: <Users className="w-4 h-4" />, label: "Data strategy for finance teams" },
  ];

  // Real testimonials from the database (approved only)
  const { data: testimonialData } = trpc.testimonials.list.useQuery();
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ name: "", role: "", company: "", content: "", isAnonymous: false });
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const submitTestimonial = trpc.testimonials.submit.useMutation({
    onSuccess: () => { setTestimonialSubmitted(true); setShowTestimonialForm(false); },
  });

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">DataMind <span className="text-violet-400">AI</span></span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/about" className="text-sm text-slate-400 hover:text-white transition">About Ayah</a>
            <a href="/chat" className="text-sm text-slate-400 hover:text-white transition">Chat</a>
            <a href="/impact" className="text-sm text-violet-300 hover:text-violet-200 transition font-medium flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Impact Report</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition">Features</a>
            <a href="#contact" className="text-sm text-slate-400 hover:text-white transition">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Sign In</Button>
            </a>
            <a href="/chat">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Get Started Free</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
            Turn Data Problems Into
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Financial Clarity
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Understand what your data issues are actually costing — in revenue, regulatory exposure, and decision quality. Built for finance and business professionals who need answers in the language of the boardroom, not the data room.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/chat">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 text-base gap-2 shadow-lg shadow-violet-900/40">
                Start Chatting Free <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="https://calendly.com/ayah-safeen/new-meeting" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 px-8 h-12 text-base gap-2">
                <Calendar className="w-4 h-4" /> Book a 1-on-1 Session
              </Button>
            </a>
          </div>

          {/* Data Impact Report CTA */}
          <div className="mt-8 mx-auto max-w-2xl">
            <a href="/impact" className="group flex items-center gap-4 bg-gradient-to-r from-violet-900/30 to-slate-900/30 border border-violet-500/20 hover:border-violet-500/40 rounded-2xl px-6 py-4 transition-all">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">What is your data problem costing you?</p>
                <p className="text-xs text-slate-400">Get a free AI-generated financial impact report — cost estimates, regulatory exposure, and the ROI of fixing it. Every number cited and explained.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition" />
            </a>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Grounded in Gartner, McKinsey & DAMA research</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Upload files & diagrams</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Regulatory & compliance frameworks included</span>
          </div>
        </div>
      </section>

      {/* ── Use Cases ────────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-slate-500 mb-6">From financial reporting integrity to regulatory compliance — ask anything</p>
          <div className="flex flex-wrap justify-center gap-3">
            {useCases.map((uc, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm">
                <span className="text-violet-400">{uc.icon}</span>
                {uc.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Data intelligence for people who speak finance
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built for analysts, controllers, CFOs, and risk managers who need to understand data in terms of P&amp;L, regulatory exposure, and business outcomes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} className={`bg-gradient-to-br ${f.color} border rounded-xl`}>
                <CardContent className="p-6">
                  <div className="text-violet-400 mb-4">{f.icon}</div>
                  <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400">From question to expert answer in seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: <MessageSquare className="w-6 h-6" />, title: "Ask your question", desc: "Describe your challenge in plain language — pipeline bottlenecks, infrastructure spend, quality issues, or anything in between." },
              { step: "02", icon: <Upload className="w-6 h-6" />, title: "Upload context (optional)", desc: "Attach schema diagrams, pipeline screenshots, or CSV files for deeper analysis." },
              { step: "03", icon: <Sparkles className="w-6 h-6" />, title: "Get expert answers", desc: "Receive structured, actionable answers backed by real enterprise data engineering experience." },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="text-xs font-mono text-violet-500 mb-2">{step.step}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What people are saying</h2>
            <p className="text-slate-400 text-sm">Real feedback from clients and collaborators. All reviews are submitted and verified before publishing.</p>
          </div>

          {/* Approved testimonials from DB */}
          {testimonialData && testimonialData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {testimonialData.map((t, i) => (
                <Card key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>
                    <div>
                      <p className="text-white font-medium text-sm">{t.isAnonymous ? "Anonymous" : (t.name ?? "Anonymous")}</p>
                      {!t.isAnonymous && t.role && <p className="text-slate-500 text-xs">{t.role}{t.company ? ` · ${t.company}` : ""}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 mb-12">
              <p className="text-slate-500 text-sm">No reviews yet — be the first to share your experience.</p>
            </div>
          )}

          {/* Submit a testimonial */}
          <div className="max-w-xl mx-auto">
            {testimonialSubmitted ? (
              <div className="text-center py-8 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Thank you for your feedback!</p>
                <p className="text-slate-400 text-sm">Your review will appear here once approved.</p>
              </div>
            ) : showTestimonialForm ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-5">Share your experience</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="anon"
                      checked={testimonialForm.isAnonymous}
                      onChange={e => setTestimonialForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                      className="w-4 h-4 accent-violet-500"
                    />
                    <label htmlFor="anon" className="text-slate-300 text-sm">Submit anonymously</label>
                  </div>
                  {!testimonialForm.isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={testimonialForm.name}
                        onChange={e => setTestimonialForm(f => ({ ...f, name: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      />
                      <input
                        type="text"
                        placeholder="Your role (optional)"
                        value={testimonialForm.role}
                        onChange={e => setTestimonialForm(f => ({ ...f, role: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      />
                      <input
                        type="text"
                        placeholder="Company (optional)"
                        value={testimonialForm.company}
                        onChange={e => setTestimonialForm(f => ({ ...f, company: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 sm:col-span-2"
                      />
                    </div>
                  )}
                  <textarea
                    rows={4}
                    placeholder="Share your experience working with Ayah or using DataMind AI..."
                    value={testimonialForm.content}
                    onChange={e => setTestimonialForm(f => ({ ...f, content: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={() => submitTestimonial.mutate(testimonialForm)}
                      disabled={!testimonialForm.content || testimonialForm.content.length < 10 || submitTestimonial.isPending}
                    >
                      {submitTestimonial.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setShowTestimonialForm(false)}>Cancel</Button>
                  </div>
                  <p className="text-slate-500 text-xs text-center">Reviews are reviewed before publishing. No spam, no fake reviews.</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:text-white hover:border-violet-500 gap-2"
                  onClick={() => setShowTestimonialForm(true)}
                >
                  <Star className="w-4 h-4" /> Leave a Review
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>



      <section className="py-20 px-4 bg-gradient-to-br from-violet-950/40 to-slate-900/40 border-y border-violet-500/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-violet-900/40">
              AS
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-violet-400 text-sm font-medium mb-2">Meet the expert behind the AI</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ayah Safin — Senior Data Engineer</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              5+ years building enterprise data systems across enterprise EDA, banking, and multiple startups.
              Toastmasters VP of Education. Passionate about clean data, scalable architecture, and helping teams avoid costly mistakes.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <a href="/about">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  View Full Profile <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="https://calendly.com/ayah-safeen/new-meeting" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2">
                  <Calendar className="w-4 h-4" /> Book a Session
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
            Ready to solve your <br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">data challenges?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join data professionals who use DataMind AI to get expert answers, design better systems, and move faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/chat">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-10 h-12 text-base gap-2 shadow-lg shadow-violet-900/40">
                Start Free — No Credit Card <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="https://calendly.com/ayah-safeen/new-meeting" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 px-8 h-12 text-base gap-2">
                <Calendar className="w-4 h-4" /> Book a Consultation
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-4 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Get in touch</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Have a specific data challenge, want to discuss a project, or just want to say hello?
              Send a message and we'll respond within 24 hours.
            </p>
            <div className="space-y-4">
              <a href="https://linkedin.com/in/safinayah" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition group">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-violet-500/50 transition">
                  <Linkedin className="w-4 h-4" />
                </div>
                <span className="text-sm">linkedin.com/in/safinayah</span>
              </a>
              <a href="https://github.com/safinayah" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition group">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-violet-500/50 transition">
                  <Github className="w-4 h-4" />
                </div>
                <span className="text-sm">github.com/safinayah</span>
              </a>
              <a href="https://calendly.com/ayah-safeen/new-meeting" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition group">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-violet-500/50 transition">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-sm">Book a session on Calendly</span>
              </a>
            </div>
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <span>DataMind AI <span className="text-slate-600">(Beta)</span> — by Ayah Safin</span>
          </div>
          <div className="flex gap-6">
            <a href="/about" className="hover:text-slate-300 transition">About</a>
            <a href="/chat" className="hover:text-slate-300 transition">Chat</a>
            <a href="/login" className="hover:text-slate-300 transition">Sign In</a>
            <a href="https://calendly.com/ayah-safeen/new-meeting" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition">Book</a>
          </div>
          <span>© 2026 Ayah Safin. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

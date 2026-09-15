import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, AlertTriangle, BarChart3, BookOpen, Calendar, CheckCircle,
  ChevronDown, ChevronUp, Copy, DollarSign, ExternalLink, FileText,
  Loader2, MessageSquare, Shield, Sliders, Sparkles, TrendingUp, X, XCircle, Zap, Building2
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { useState, useCallback } from "react";

const RISK_COLORS: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border-red-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Not Applicable": "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

const VALUE_COLORS: Record<string, string> = {
  High: "text-emerald-400",
  Medium: "text-amber-400",
  Low: "text-red-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  Immediate: "bg-red-500/10 text-red-400 border border-red-500/20",
  "Short-term": "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  Strategic: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
};

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function SourceLink({ source, url }: { source: string; url?: string }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition underline underline-offset-2"
      >
        <BookOpen className="w-3 h-3 flex-shrink-0" />
        {source}
        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <BookOpen className="w-3 h-3" />
      {source}
    </span>
  );
}

// Adjustable assumptions panel — recalculates client-side
function AdjustableAssumptions({
  item,
  onRecalculate,
}: {
  item: any;
  onRecalculate: (low: number, high: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    (item.assumptions || []).forEach((a: any) => { init[a.key] = a.value; });
    return init;
  });
  const [warning, setWarning] = useState<string | null>(null);

  const handleChange = useCallback((key: string, newVal: number, min: number, max: number) => {
    setValues(prev => ({ ...prev, [key]: newVal }));
    if (newVal < min || newVal > max) {
      setWarning(`"${key}" is outside the benchmark range (${min}–${max}). Results may be less reliable.`);
    } else {
      setWarning(null);
    }
  }, []);

  // Simple recalculation: scale the original estimate proportionally
  const recalculate = useCallback(() => {
    const assumptions = item.assumptions || [];
    if (assumptions.length === 0) return;
    let scaleLow = 1;
    let scaleHigh = 1;
    assumptions.forEach((a: any) => {
      if (a.value && a.value !== 0) {
        const ratio = values[a.key] / a.value;
        scaleLow *= ratio;
        scaleHigh *= ratio;
      }
    });
    const newLow = Math.round((item.estimatedCostLow || 0) * scaleLow);
    const newHigh = Math.round((item.estimatedCostHigh || 0) * scaleHigh);
    onRecalculate(newLow, newHigh);
  }, [values, item, onRecalculate]);

  if (!item.assumptions || item.assumptions.length === 0) return null;

  return (
    <div className="mt-3 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 transition text-xs text-slate-400 hover:text-white"
      >
        <span className="flex items-center gap-1.5">
          <Sliders className="w-3 h-3" />
          Adjust assumptions & recalculate
        </span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-slate-900/60 space-y-4">
          <p className="text-xs text-slate-500 italic">
            These are the key variables used in the formula above. Change them to reflect your organisation's actual numbers.
          </p>
          {(item.assumptions || []).map((a: any) => (
            <div key={a.key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">{a.label}</label>
                <span className="text-xs text-violet-400 font-mono">
                  {values[a.key]?.toLocaleString()} {a.unit}
                </span>
              </div>
              <input
                type="range"
                min={a.min}
                max={a.max}
                step={a.unit === "%" ? 1 : Math.max(1, Math.round((a.max - a.min) / 100))}
                value={values[a.key] ?? a.value}
                onChange={e => handleChange(a.key, Number(e.target.value), a.min, a.max)}
                className="w-full accent-violet-500 h-1.5"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                <span>{a.min.toLocaleString()} {a.unit}</span>
                <span className="text-slate-500 text-center flex-1 px-2">{a.description}</span>
                <span>{a.max.toLocaleString()} {a.unit}</span>
              </div>
            </div>
          ))}
          {warning && (
            <p className="text-xs text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {warning}
            </p>
          )}
          <Button
            size="sm"
            onClick={recalculate}
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs w-full"
          >
            Recalculate with my numbers
          </Button>
          <p className="text-xs text-slate-600 text-center">
            Recalculation scales the original formula proportionally. For a precise audit, consult a financial analyst.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DataImpactReport() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [copied, setCopied] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Per-item adjusted costs (keyed by index)
  const [adjustedCosts, setAdjustedCosts] = useState<Record<number, { low: number; high: number }>>({})

  // Read newConversation query param from the URL (set by DataImpactGenerator after auto-creating a conversation)
  const newConversationId = (() => {
    const val = new URLSearchParams(window.location.search).get("newConversation");
    return val ? Number(val) : null;
  })();

  const { data, isLoading, error } = trpc.dataImpact.getByToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Report not found</p>
          <p className="text-slate-400 mb-6">This report may have expired or the link is invalid.</p>
          <Link href="/impact">
            <Button className="bg-violet-600 hover:bg-violet-700">Generate a New Report</Button>
          </Link>
        </div>
      </div>
    );
  }

  const report = data.report;
  const fi = report.financialImpact;
  const dv = report.dataValuation;
  const roi = report.fixROI;
  const isCaseStudyMode = report.dataMode === "case_study";

  // Compute totals from adjusted costs if any
  const breakdown: any[] = fi?.costBreakdown || [];
  const totalLow = breakdown.reduce((sum: number, item: any, i: number) => {
    const adj = adjustedCosts[i];
    return sum + (adj ? adj.low : (item.estimatedCostLow ?? 0));
  }, 0);
  const totalHigh = breakdown.reduce((sum: number, item: any, i: number) => {
    const adj = adjustedCosts[i];
    return sum + (adj ? adj.high : (item.estimatedCostHigh ?? 0));
  }, 0);
  const hasAdjustments = Object.keys(adjustedCosts).length > 0;

  return (
    <div className="min-h-screen bg-[#080C14] text-white">
      {/* New conversation notification banner */}
      {newConversationId && !bannerDismissed && (
        <div className="bg-violet-950/60 border-b border-violet-500/30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-violet-300" />
              </div>
              <p className="text-sm text-violet-200">
                <span className="font-semibold">A conversation was created for you</span> — I've pre-loaded your impact data so we can explore solutions, plan remediation, or build a business case together.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/chat/${newConversationId}`}>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4">
                  Open Conversation
                </Button>
              </Link>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-violet-400 hover:text-white transition p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 sticky top-0 z-10 bg-[#080C14]/90 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
            <ArrowLeft className="w-4 h-4" /> DataMind AI
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Share Report"}
            </Button>
            <a href="https://calendly.com/ayah-safeen" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Calendar className="w-4 h-4" /> Book a Session
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-violet-400 text-sm mb-3">
            <Sparkles className="w-4 h-4" />
            <span>AI-Generated Data Impact Report</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">
              {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {isCaseStudyMode && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Case Study Mode
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{report.title}</h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">{report.executiveSummary}</p>
        </div>

        {/* Case Study Mode Notice */}
        {isCaseStudyMode && (
          <div className="mb-8 bg-amber-900/10 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-1">No business size provided — showing reference case studies</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Because team size and revenue were not provided, this report cannot calculate formula-based estimates for your organisation.
                  Instead, it shows verified real-world cases from similar industries to illustrate the scale of financial impact.
                  These are reference points, not estimates for your specific situation.
                  To get a formula-based estimate, <Link href="/impact" className="text-violet-400 underline">regenerate the report</Link> and include your team size and revenue range.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Strip — only in formula mode */}
        {!isCaseStudyMode && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Annual Cost (Low){hasAdjustments && " *"}
              </p>
              <p className="text-2xl font-bold text-red-400">
                {hasAdjustments ? formatCurrency(totalLow) : formatCurrency(fi?.annualCostLow)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Annual Cost (High){hasAdjustments && " *"}
              </p>
              <p className="text-2xl font-bold text-red-300">
                {hasAdjustments ? formatCurrency(totalHigh) : formatCurrency(fi?.annualCostHigh)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fix ROI</p>
              <p className="text-2xl font-bold text-emerald-400">
                {roi?.roiPercent != null ? `${roi.roiPercent}%` : "—"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-violet-900/20 to-violet-900/5 border border-violet-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payback Period</p>
              <p className="text-2xl font-bold text-violet-400">
                {roi?.paybackPeriodMonths != null ? `${roi.paybackPeriodMonths} mo` : "—"}
              </p>
            </div>
          </div>
        )}
        {hasAdjustments && (
          <p className="text-xs text-slate-500 -mt-6 mb-8 text-right italic">* Totals reflect your adjusted assumptions</p>
        )}

        {/* ── Visual Summary Charts (formula mode only) ───────────────────── */}
        {!isCaseStudyMode && breakdown.length > 0 && (() => {
          const CHART_COLORS = ["#7c3aed", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"];

          // Cost breakdown donut data
          const donutData = breakdown
            .filter((item: any) => (item.estimatedCostHigh ?? 0) > 0)
            .map((item: any, i: number) => ({
              name: item.category,
              value: Math.round(((item.estimatedCostLow ?? 0) + (item.estimatedCostHigh ?? 0)) / 2),
              color: CHART_COLORS[i % CHART_COLORS.length],
            }));

          // Regulatory risk bar data
          const riskOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1, "Not Applicable": 0 };
          const riskData = (report.regulatoryRisk || [])
            .filter((r: any) => r.riskLevel !== "Not Applicable")
            .map((r: any) => ({
              name: r.regulation.length > 12 ? r.regulation.slice(0, 12) + "…" : r.regulation,
              fullName: r.regulation,
              score: riskOrder[r.riskLevel] ?? 1,
              fill: r.riskLevel === "High" ? "#ef4444" : r.riskLevel === "Medium" ? "#f59e0b" : "#10b981",
            }));

          // ROI comparison bar data
          const roiBarData = roi ? [
            { name: "Annual Cost", value: fi?.annualCostHigh ?? 0, fill: "#ef4444" },
            { name: "Fix Cost", value: roi.estimatedFixCostHigh ?? 0, fill: "#f59e0b" },
            { name: "Annual Savings", value: roi.projectedAnnualSavings ?? 0, fill: "#10b981" },
          ].filter(d => d.value > 0) : [];

          return (
            <div className="mb-10 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Visual Summary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cost Breakdown Donut */}
                {donutData.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                    <p className="text-sm font-medium text-white mb-4">Cost Breakdown</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {donutData.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                          formatter={(v: any) => formatCurrency(v)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {donutData.map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          {d.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ROI Comparison Bar */}
                {roiBarData.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                    <p className="text-sm font-medium text-white mb-4">Cost vs Fix vs Savings</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={roiBarData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                          formatter={(v: any) => formatCurrency(v)}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {roiBarData.map((d: any, i: number) => (
                            <Cell key={i} fill={d.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Regulatory Risk Bars */}
              {riskData.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                  <p className="text-sm font-medium text-white mb-4">Regulatory Risk Exposure</p>
                  <div className="space-y-3">
                    {riskData.map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-24 flex-shrink-0 truncate" title={r.fullName}>{r.fullName}</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(r.score / 3) * 100}%`, background: r.fill }}
                          />
                        </div>
                        <span className="text-xs font-medium flex-shrink-0" style={{ color: r.fill }}>
                          {r.score === 3 ? "High" : r.score === 2 ? "Medium" : "Low"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Problem Statement */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-semibold text-white">The Problem</h2>
          </div>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-5">
              <p className="text-slate-300 leading-relaxed">{report.problemStatement}</p>
            </CardContent>
          </Card>
        </section>

        {/* Financial Impact */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">
              {isCaseStudyMode ? "Reference Case Studies" : "Financial Impact"}
            </h2>
            {!isCaseStudyMode && (
              <span className="text-xs text-slate-500 ml-1">— formula-based estimates</span>
            )}
          </div>

          <div className="space-y-4 mb-4">
            {breakdown.map((item: any, i: number) => {
              const adj = adjustedCosts[i];
              const displayLow = adj ? adj.low : item.estimatedCostLow;
              const displayHigh = adj ? adj.high : item.estimatedCostHigh;

              return (
                <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm font-semibold text-white">{item.category}</p>
                    {!isCaseStudyMode && displayLow != null && displayHigh != null && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-red-400">
                          {formatCurrency(displayLow)} – {formatCurrency(displayHigh)}
                        </p>
                        <p className="text-xs text-slate-600">per year</p>
                        {adj && (
                          <p className="text-xs text-violet-400">adjusted</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">{item.description}</p>

                  {/* Case Study Card */}
                  {isCaseStudyMode && item.caseStudy && (
                    <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-amber-300">
                          {item.caseStudy.organisation} ({item.caseStudy.year})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">{item.caseStudy.incident}</p>
                      <p className="text-sm font-bold text-amber-400 mb-2">
                        Verified financial impact: {item.caseStudy.financialImpact}
                      </p>
                      <SourceLink source={item.caseStudy.source} url={item.caseStudy.sourceUrl} />
                    </div>
                  )}

                  {/* Assumption → Formula → Result chain (formula mode) */}
                  {!isCaseStudyMode && (
                    <div className="space-y-2">
                      {/* Assumption */}
                      {item.assumption && (
                        <div className="bg-slate-800/40 border-l-2 border-violet-500/50 rounded-r-lg px-3 py-2">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Benchmark used</p>
                          <p className="text-xs text-slate-300 leading-relaxed italic">"{item.assumption}"</p>
                        </div>
                      )}
                      {/* Formula */}
                      {item.formula && (
                        <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Calculation</p>
                          <p className="text-xs text-slate-200 leading-relaxed font-mono">{item.formula}</p>
                        </div>
                      )}
                      {/* Source link */}
                      {item.source && (
                        <div className="flex items-center gap-1 pt-1">
                          <SourceLink source={item.source} url={item.sourceUrl} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Adjustable assumptions slider panel */}
                  {!isCaseStudyMode && (
                    <AdjustableAssumptions
                      item={item}
                      onRecalculate={(low, high) =>
                        setAdjustedCosts(prev => ({ ...prev, [i]: { low, high } }))
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Methodology */}
          {fi?.methodology && (
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Methodology & Assumptions</p>
              <p className="text-xs text-slate-400 leading-relaxed italic">{fi.methodology}</p>
            </div>
          )}
        </section>

        {/* Data Valuation */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-semibold text-white">Data Asset Valuation</h2>
            {dv?.sourceUrl ? (
              <a href={dv.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 ml-1 underline underline-offset-2">
                Infonomics framework <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-500 ml-1">Infonomics framework</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card className="bg-slate-900/50 border-slate-700 text-center">
              <CardContent className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Asset Score</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {dv?.assetScore}<span className="text-slate-500 text-xl">/10</span>
                </p>
                <p className="text-xs text-slate-500">Overall data quality rating</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Intrinsic Value</p>
                <p className={`text-2xl font-bold mb-2 ${VALUE_COLORS[dv?.intrinsicValue] || "text-white"}`}>
                  {dv?.intrinsicValue}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">{dv?.intrinsicExplanation}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Business Value</p>
                <p className={`text-2xl font-bold mb-2 ${VALUE_COLORS[dv?.businessValue] || "text-white"}`}>
                  {dv?.businessValue}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">{dv?.businessExplanation}</p>
              </CardContent>
            </Card>
          </div>
          {dv?.untappedPotential && (
            <div className="bg-violet-900/10 border border-violet-500/20 rounded-xl p-4">
              <p className="text-xs text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Untapped Potential
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{dv.untappedPotential}</p>
            </div>
          )}
        </section>

        {/* Regulatory Risk */}
        {report.regulatoryRisk?.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold text-white">Regulatory Risk</h2>
            </div>
            <div className="space-y-3">
              {report.regulatoryRisk.map((risk: any, i: number) => (
                <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="font-semibold text-white">{risk.regulation}</span>
                      {risk.relevantArticle && (
                        <p className="text-xs text-slate-500 mt-0.5">{risk.relevantArticle}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${RISK_COLORS[risk.riskLevel] || RISK_COLORS["Low"]}`}>
                      {risk.riskLevel} Risk
                    </span>
                  </div>
                  {risk.potentialFine && risk.riskLevel !== "Not Applicable" && (
                    <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-2">
                      <p className="text-xs text-amber-400 uppercase tracking-wider mb-0.5">Maximum penalty (legal text)</p>
                      <p className="text-sm font-medium text-amber-300">{risk.potentialFine}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{risk.explanation}</p>
                  {risk.sourceUrl && (
                    <SourceLink source={`Official legal text — ${risk.regulation}`} url={risk.sourceUrl} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fix ROI — formula mode only */}
        {!isCaseStudyMode && roi && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">ROI of Fixing It</h2>
            </div>
            <Card className="bg-gradient-to-br from-emerald-900/20 to-slate-900/50 border-emerald-500/20">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fix Cost Range</p>
                    <p className="text-sm font-semibold text-white">
                      {roi.estimatedFixCostLow != null && roi.estimatedFixCostHigh != null
                        ? `${formatCurrency(roi.estimatedFixCostLow)} – ${formatCurrency(roi.estimatedFixCostHigh)}`
                        : roi.estimatedFixCost || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Annual Savings</p>
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(roi.projectedAnnualSavings)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">ROI</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {roi.roiPercent != null ? `${roi.roiPercent}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payback</p>
                    <p className="text-sm font-semibold text-white">
                      {roi.paybackPeriodMonths != null ? `${roi.paybackPeriodMonths} months` : "—"}
                    </p>
                  </div>
                </div>
                {/* ROI formula */}
                {roi.roiFormula && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">How ROI was calculated</p>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed">{roi.roiFormula}</p>
                  </div>
                )}
                {roi.estimatedFixCostBasis && (
                  <div className="bg-slate-800/40 border-l-2 border-emerald-500/40 rounded-r-lg px-3 py-2 mb-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fix cost basis</p>
                    <p className="text-xs text-slate-400 italic">{roi.estimatedFixCostBasis}</p>
                  </div>
                )}
                <p className="text-sm text-slate-300 leading-relaxed">{roi.roiNarrative}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-semibold text-white">Recommended Next Steps</h2>
            </div>
            <div className="space-y-3">
              {report.recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex gap-4 bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <div className={`flex-shrink-0 w-20 text-xs font-semibold px-2 py-1 rounded-lg text-center h-fit ${PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS["Strategic"]}`}>
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">{rec.action}</p>
                    {rec.rationale && (
                      <p className="text-xs text-slate-500 mb-1 italic">{rec.rationale}</p>
                    )}
                    <p className="text-xs text-slate-400">{rec.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Benchmarks */}
        {report.benchmarks?.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-semibold text-white">Industry Benchmarks</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.benchmarks.map((b: any, i: number) => (
                <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <p className="text-xl font-bold text-violet-400 mb-1">{b.stat}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{b.context}</p>
                  <SourceLink source={b.source} url={b.sourceUrl} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        {report.disclaimer && (
          <div className="mb-8 bg-slate-900/30 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-400">Disclaimer: </span>
              {report.disclaimer}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-900/30 to-slate-900/50 border border-violet-500/20 rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-white mb-2">Ready to fix this?</h3>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Book a 30-minute strategy session with Ayah Safin — a senior data engineer who has helped companies reduce data costs by up to 80% and build systems that actually work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://calendly.com/ayah-safeen" target="_blank" rel="noopener noreferrer">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 gap-2">
                <Calendar className="w-4 h-4" /> Book a Free Strategy Session
              </Button>
            </a>
            <Link href="/impact">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 gap-2">
                <FileText className="w-4 h-4" /> Generate Another Report
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

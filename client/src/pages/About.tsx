import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Bot, Calendar, CheckCircle, Code2, Database, Cloud, Users,
  Layers, Shield, Zap, BarChart3, GitBranch, Github, Linkedin,
  Award, MapPin, Briefcase, BookOpen, Star, MessageSquarePlus
} from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

// ── Testimonial Sub-section ───────────────────────────────────────────────────
type TestimonialType = "personal" | "tool";

function TestimonialCard({ name, role, company, content, isAnonymous }: {
  name?: string | null;
  role?: string | null;
  company?: string | null;
  content: string;
  isAnonymous: boolean;
}) {
  return (
    <Card className="bg-slate-900/60 border border-slate-800 rounded-xl">
      <CardContent className="p-6">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, j) => (
            <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{content}"</p>
        <div>
          <p className="text-white font-medium text-sm">{isAnonymous ? "Anonymous" : (name ?? "Anonymous")}</p>
          {!isAnonymous && role && <p className="text-slate-500 text-xs">{role}{company ? ` · ${company}` : ""}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialForm({ type, onSuccess }: { type: TestimonialType; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", role: "", company: "", content: "", isAnonymous: false });
  const submit = trpc.testimonials.submit.useMutation({ onSuccess });
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 mt-6">
      <h4 className="text-white font-semibold mb-4 text-sm">
        {type === "personal" ? "Share your experience working with Ayah" : "Share your experience with DataMind AI"}
      </h4>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" id={`anon-${type}`} checked={form.isAnonymous}
            onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
            className="w-4 h-4 accent-violet-500" />
          <label htmlFor={`anon-${type}`} className="text-slate-300 text-sm">Submit anonymously</label>
        </div>
        {!form.isAnonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Your name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            <input type="text" placeholder="Your role (optional)"
              value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            <input type="text" placeholder="Company (optional)"
              value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 sm:col-span-2" />
          </div>
        )}
        <textarea rows={4}
          placeholder={type === "personal" ? "Describe your experience working with Ayah..." : "How did DataMind AI help you?"}
          value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none" />
        <div className="flex gap-3">
          <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => submit.mutate({ ...form, testimonialType: type })}
            disabled={form.content.length < 10 || submit.isPending}>
            {submit.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
        <p className="text-slate-500 text-xs text-center">Reviews are moderated before publishing.</p>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const { data: personalData } = trpc.testimonials.list.useQuery({ testimonialType: "personal" });
  const { data: toolData } = trpc.testimonials.list.useQuery({ testimonialType: "tool" });
  const [showForm, setShowForm] = useState<TestimonialType | null>(null);
  const [submitted, setSubmitted] = useState<TestimonialType | null>(null);

  return (
    <section className="py-20 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What people say</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">Real feedback from clients, collaborators, and DataMind AI users. All reviews are moderated before publishing.</p>
        </div>

        {/* Personal testimonials */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">About Ayah</h3>
              <p className="text-slate-400 text-sm mt-1">From clients and professional collaborators</p>
            </div>
            {submitted === "personal" ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Thank you — pending review
              </div>
            ) : (
              <Button variant="outline" size="sm"
                className="border-slate-700 text-slate-300 hover:text-white hover:border-violet-500 gap-2"
                onClick={() => setShowForm(showForm === "personal" ? null : "personal")}>
                <MessageSquarePlus className="w-4 h-4" />
                {showForm === "personal" ? "Cancel" : "Leave a review"}
              </Button>
            )}
          </div>
          {personalData && personalData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {personalData.map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Star className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No reviews yet — be the first to share your experience.</p>
            </div>
          )}
          {showForm === "personal" && submitted !== "personal" && (
            <TestimonialForm type="personal" onSuccess={() => { setShowForm(null); setSubmitted("personal"); }} />
          )}
        </div>

        {/* Tool testimonials */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">About DataMind AI</h3>
              <p className="text-slate-400 text-sm mt-1">From users of the platform</p>
            </div>
            {submitted === "tool" ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Thank you — pending review
              </div>
            ) : (
              <Button variant="outline" size="sm"
                className="border-slate-700 text-slate-300 hover:text-white hover:border-violet-500 gap-2"
                onClick={() => setShowForm(showForm === "tool" ? null : "tool")}>
                <MessageSquarePlus className="w-4 h-4" />
                {showForm === "tool" ? "Cancel" : "Leave a review"}
              </Button>
            )}
          </div>
          {toolData && toolData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {toolData.map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Bot className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No reviews yet — try DataMind AI and share your experience.</p>
            </div>
          )}
          {showForm === "tool" && submitted !== "tool" && (
            <TestimonialForm type="tool" onSuccess={() => { setShowForm(null); setSubmitted("tool"); }} />
          )}
        </div>
      </div>
    </section>
  );
}

// ── Calendly Inline Widget ────────────────────────────────────────────────────
function CalendlyWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <div
      className="calendly-inline-widget w-full rounded-xl overflow-hidden border border-slate-700"
      data-url="https://calendly.com/ayah-safeen/new-meeting?hide_event_type_details=1&hide_gdpr_banner=1&background_color=0f1117&text_color=ffffff&primary_color=7c3aed"
      style={{ minWidth: "320px", height: "700px" }}
    />
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────────────
const EXPERIENCE = [
  {
    role: "Full-Stack Developer & Data Architect — AFIS",
    company: "ASAL Technologies (Collaboration)",
    period: "Nov 2025 – Present",
    badge: "Ongoing",
    badgeColor: "emerald",
    desc: "Leading full-stack development of an MVP Automated Fingerprint Identification System (AFIS) for biometric security. I own the entire data layer — from image ingestion and registration to case governance and database architecture.",
    highlights: [
      "Designed the full image registration pipeline aligned with SourceAFIS library specifications",
      "Built a dynamic ruler mechanism to handle latent fingerprints across different scales",
      "Architected the master database and reference fingerprint database",
      "Owned full case registration from design to implementation with data governance",
      "Frontend: React/TypeScript with Konva.js for advanced image manipulation",
      "Backend: Spring Boot (Java 17) with SourceAFIS for fingerprint processing",
    ],
    tags: ["React", "TypeScript", "Spring Boot", "Java", "PostgreSQL", "Docker", "SourceAFIS"],
  },
  {
    role: "Senior R&D Engineer — Data Infrastructure",
    company: "ASAL Technologies",
    period: "Jun 2022 – Nov 2026",
    badge: null,
    badgeColor: null,
    desc: "Data Expert & sole owner of the data infrastructure for an enterprise EDA tool used by global semiconductor companies to manage chip verification at scale.",
    highlights: [
      "Owned end-to-end data infrastructure as the designated Data Expert",
      "Led complex database migrations (MySQL → PostgreSQL)",
      "Built dynamic ETL frameworks and PoC pipelines",
      "Optimized Power BI reports and enabled client analytics",
    ],
    tags: ["Python", "SQL", "Prefect", "Dask", "Power BI", "Django", "PostgreSQL"],
  },
  {
    role: "Cloud Infrastructure Consultant",
    company: "ASAL Technologies (Gaming Startup)",
    period: "1-Month Consultation",
    badge: null,
    badgeColor: null,
    desc: "Audited and redesigned the backend architecture of a gaming startup, identifying root architectural issues driving 58% cost overruns.",
    highlights: [
      "Identified architectural root causes of cost overruns",
      "Recommended Step Functions → ECS migration (70–80% savings)",
      "Migrated REST API Gateway to HTTP API (71% cost reduction)",
      "Guided full IaC migration using CloudFormation",
    ],
    tags: ["AWS", "CloudFormation", "DynamoDB", "API Gateway"],
  },
  {
    role: "Data Engineer — Employee Empowerment Platform",
    company: "ASAL Technologies",
    period: "Jun 2022 – Nov 2022",
    badge: null,
    badgeColor: null,
    desc: "Built data extraction and integration pipelines for an employee empowerment platform, connecting engineering tools into a unified data layer.",
    highlights: [
      "Integrated Jira, Gmail, and GitHub APIs into a unified pipeline",
      "Enforced data consistency and governance policies",
      "Ensured alignment with company terms and conditions",
    ],
    tags: ["Python", "GitHub API", "Data Governance", "ETL"],
  },
  {
    role: "Data Engineer",
    company: "A Palestinian Bank",
    period: "Nov 2021 – Jun 2022",
    badge: null,
    badgeColor: null,
    desc: "Founded the Data Engineering section from scratch, establishing the core data infrastructure for the financial team.",
    highlights: [
      "Built the data infrastructure from the ground up",
      "Developed pipelines for financial reporting",
      "Established data engineering practices and standards",
    ],
    tags: ["SQL", "Python", "Data Infrastructure"],
  },
  {
    role: "Business Analytics Developer",
    company: "An Early-Stage Startup",
    period: "Dec 2020 – Nov 2021",
    badge: null,
    badgeColor: null,
    desc: "Built a BI-powered AI analytics tool for retail stores that increased sales by 30% through data-driven insights.",
    highlights: [
      "Built end-to-end POS data pipeline",
      "Developed AI-powered sales analytics tool",
      "Delivered 30% sales increase for retail clients",
    ],
    tags: ["Python", "Power BI", "Machine Learning", "ETL"],
  },
];

const SKILLS = [
  {
    category: "Data Engineering",
    icon: <Database className="w-5 h-5" />,
    items: ["ETL Pipeline Design", "Data Modeling", "Data Mart Design", "EAV Modeling", "Data Quality Dimensions"],
  },
  {
    category: "Programming & Tools",
    icon: <Code2 className="w-5 h-5" />,
    items: ["Python", "SQL", "Git", "Shell", "Docker", "Java (Spring Boot)", "React / TypeScript"],
  },
  {
    category: "Cloud & Infrastructure",
    icon: <Cloud className="w-5 h-5" />,
    items: ["AWS (CloudFormation, DynamoDB, API Gateway)", "Infrastructure as Code", "Cost Optimization"],
  },
  {
    category: "Data Governance & Quality",
    icon: <Shield className="w-5 h-5" />,
    items: ["DAMA-DMBOK Knowledge Areas", "CDMP Candidate", "Data Quality Frameworks", "Governance Policies", "Data Lineage & Stewardship", "Compliance & Regulatory Alignment"],
  },
  {
    category: "Analytics & BI",
    icon: <BarChart3 className="w-5 h-5" />,
    items: ["Power BI", "Dashboard Design", "KPI Reporting", "Client Analytics Enablement"],
  },
  {
    category: "Leadership",
    icon: <Users className="w-5 h-5" />,
    items: ["VP of Education — Toastmasters ASAL Club", "Startup Mentorship", "Cross-Functional Team Leadership", "Technical Communication"],
  },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function About() {
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
            <a href="/" className="text-sm text-slate-400 hover:text-white transition">Home</a>
            <a href="/about" className="text-sm text-white font-medium">About Ayah</a>
            <a href="/chat" className="text-sm text-slate-400 hover:text-white transition">Chat</a>
            <a href="/#contact" className="text-sm text-slate-400 hover:text-white transition">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Sign In</Button>
            </a>
            <a href="/register">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Get Started Free</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero / Bio ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start gap-10">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-violet-900/40">
                AS
              </div>
            </div>
            {/* Bio */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">Ayah Safin</h1>
                <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-sm">
                  Data Governance Expert
                </span>
              </div>
              <p className="text-violet-400 font-medium mb-1">Senior Data Engineer & Consultant</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-5">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Palestine</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> 5+ years experience</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Data Governance</span>
              </div>
              <p className="text-slate-300 leading-relaxed max-w-2xl mb-6">
                I'm a Senior Data Engineer with 5+ years of experience designing enterprise data systems, optimizing cloud infrastructure, and building data governance frameworks. I've worked across fintech, biometrics, legal tech, and semiconductor EDA — always with the same goal: clean data, scalable architecture, and zero wasted infrastructure spend.
              </p>
              <p className="text-slate-400 leading-relaxed max-w-2xl mb-8">
                I'm VP of Education at Toastmasters ASAL Club and the expert behind DataMind AI — a platform that makes data consulting accessible to anyone who needs it.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="https://calendly.com/ayah-safeen/new-meeting" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                    <Calendar className="w-4 h-4" /> Book a Consultation
                  </Button>
                </a>
                <a href="/register">
                  <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2">
                    Try the AI Assistant <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <a href="https://linkedin.com/in/safinayah" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-2">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </Button>
                </a>
                <a href="https://github.com/safinayah" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-2">
                    <Github className="w-4 h-4" /> GitHub
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Stats ────────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "5+", label: "Years Experience" },
              { value: "30%", label: "Sales Increase (Retail Client)" },
              { value: "50–80%", label: "Cost Reduction (AWS)" },
              { value: "10+", label: "Active Platform Users" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-violet-400 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">Experience</h2>
          <div className="space-y-5">
            {EXPERIENCE.map((exp, i) => (
              <Card key={i} className="bg-slate-900/60 border border-slate-800 hover:border-violet-500/30 transition-colors rounded-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-lg">{exp.role}</h3>
                        {exp.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            exp.badgeColor === "emerald"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                          }`}>
                            {exp.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-violet-400 text-sm">{exp.company}</p>
                    </div>
                    <span className="text-sm text-slate-500 whitespace-nowrap">{exp.period}</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{exp.desc}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
                    {exp.highlights.map((h, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {exp.tags.map((tag, j) => (
                      <span key={j} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">Skills & Expertise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SKILLS.map((group, i) => (
              <Card key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="text-violet-400">{group.icon}</div>
                    <h3 className="text-white font-semibold">{group.category}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item, j) => (
                      <span key={j} className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/50 rounded-md text-xs text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications / Education ───────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">Certifications & Education</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Card className="bg-violet-950/30 border border-violet-500/50 rounded-xl ring-1 ring-violet-500/20 shadow-lg shadow-violet-900/20">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/30 border border-violet-500/50 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-violet-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-semibold">CDMP — Certified Data Management Professional</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-medium">Ongoing</span>
                  </div>
                  <p className="text-violet-300 text-sm mb-2">DAMA International · Candidate</p>
                  <p className="text-slate-300 text-sm">Studying all 11 DAMA-DMBOK knowledge areas including Data Governance, Data Quality, Master Data Management, and Data Architecture.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60 border border-slate-800 rounded-xl">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">B.Sc. in Computer Engineering</h3>
                  <p className="text-blue-400 text-sm mb-2">Birzeit University</p>
                  <p className="text-slate-400 text-sm">Strong foundation in algorithms, data structures, systems design, and software engineering principles.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60 border border-slate-800 rounded-xl">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">VP of Education — Toastmasters ASAL Club</h3>
                  <p className="text-emerald-400 text-sm mb-2">Toastmasters International</p>
                  <p className="text-slate-400 text-sm">Leading educational programs, mentoring club members, and developing public speaking and leadership skills.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/60 border border-slate-800 rounded-xl">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">DataMind AI — Creator & Expert</h3>
                  <p className="text-amber-400 text-sm mb-2">safinayah.manus.space</p>
                  <p className="text-slate-400 text-sm">Built and deployed a full-stack AI data consulting platform with multi-conversation chat, media uploads, and admin-managed topics.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Book a Session ───────────────────────────────────────────────────── */}
      <section id="book" className="py-20 px-4 bg-gradient-to-br from-violet-950/40 to-slate-900/40 border-y border-violet-500/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Book a Consultation</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Ready to discuss your data challenges directly? Book a 1-on-1 session with Ayah for architecture reviews, data strategy, cost optimization, or startup mentorship.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* What to expect */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-5">What to expect</h3>
              <div className="space-y-4">
                {[
                  { icon: <Database className="w-4 h-4" />, title: "Data Architecture Review", desc: "Walk through your current system, identify bottlenecks, and get a clear improvement roadmap." },
                  { icon: <Cloud className="w-4 h-4" />, title: "Cloud Cost Audit", desc: "Identify the root causes of your cloud spend and get specific, actionable recommendations." },
                  { icon: <Layers className="w-4 h-4" />, title: "ETL & Pipeline Design", desc: "Design or review your data pipelines for reliability, performance, and maintainability." },
                  { icon: <Users className="w-4 h-4" />, title: "Startup Mentorship", desc: "Get guidance on building your data foundation right from day one — without wasting budget." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-0.5">{item.title}</p>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-slate-300 text-sm leading-relaxed">
                  <span className="text-white font-medium">Not sure if a session is right for you?</span> Try the AI assistant first — it's free and available 24/7. If you need a deeper, personalized review, then book a session.
                </p>
                <a href="/register" className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm mt-3 transition">
                  Try the AI Assistant free <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            {/* Calendly widget */}
            <div>
              <CalendlyWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <TestimonialsSection />

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
            <a href="/" className="hover:text-slate-300 transition">Home</a>
            <a href="/chat" className="hover:text-slate-300 transition">Chat</a>
            <a href="/login" className="hover:text-slate-300 transition">Sign In</a>
          </div>
          <span>© 2026 Ayah Safin. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

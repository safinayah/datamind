import { Link } from "wouter";
import {
  ArrowLeft, Database, Shield, Layers, Server,
  Monitor, Box, CheckCircle, Users, FileText, Search, GitBranch
} from "lucide-react";

const TECH_STACK = [
  { layer: "Frontend", icon: <Monitor className="w-5 h-5 text-cyan-400" />, items: ["React", "TypeScript", "Component-based case management UI", "Responsive design for legal workflows"] },
  { layer: "Backend", icon: <Server className="w-5 h-5 text-violet-400" />, items: ["RESTful API architecture", "Business logic for case lifecycle", "Role-based access control", "Audit trail & logging"] },
  { layer: "Database", icon: <Database className="w-5 h-5 text-emerald-400" />, items: ["Relational database design", "Case & document schema", "Status tracking & versioning", "Data integrity constraints"] },
  { layer: "Infrastructure", icon: <Box className="w-5 h-5 text-orange-400" />, items: ["Docker-based deployment", "Environment configuration management", "Scalable service architecture"] },
];

const CONTRIBUTIONS = [
  {
    icon: <Layers className="w-5 h-5 text-cyan-400" />,
    title: "System Architecture Design",
    desc: "Designed the complete system architecture from scratch — defining the data model, service boundaries, API contracts, and component structure. The architecture was built to support the full case lifecycle: intake, review, annotation, decision, and archival.",
  },
  {
    icon: <Database className="w-5 h-5 text-emerald-400" />,
    title: "Database Schema & Data Modeling",
    desc: "Designed the relational database schema to represent legal cases, documents, review stages, and lawyer assignments. Special attention was paid to data normalization, referential integrity, and supporting complex queries for case filtering and reporting.",
  },
  {
    icon: <FileText className="w-5 h-5 text-violet-400" />,
    title: "Case Registration & Lifecycle Management",
    desc: "Built the full case registration flow — from initial intake form to case status transitions. Each case moves through defined stages with validation rules at each transition, ensuring no case can be advanced without the required information being complete.",
  },
  {
    icon: <Search className="w-5 h-5 text-yellow-400" />,
    title: "Review & Auditing Workflows",
    desc: "Implemented the core review workflows used by the 10 lawyers on the platform. This includes case assignment, review checklists, annotation tools, and decision recording — all designed to match how legal professionals actually work.",
  },
  {
    icon: <Shield className="w-5 h-5 text-pink-400" />,
    title: "Data Governance & Legal Compliance",
    desc: "Implemented data governance policies aligned with legal standards — including immutable audit trails, role-based access control, and data retention rules. Every action on a case is logged with a timestamp and user identity.",
  },
  {
    icon: <GitBranch className="w-5 h-5 text-orange-400" />,
    title: "End-to-End Implementation",
    desc: "Led the implementation from design to deployment — covering frontend components, backend APIs, database migrations, and infrastructure setup. The platform was delivered in 2 months and is actively used in production.",
  },
];

const IMPACT = [
  { metric: "10", label: "Lawyers actively using the platform" },
  { metric: "2mo", label: "From design to production" },
  { metric: "100%", label: "Case data completeness enforced" },
];

export default function ProjectMizan() {
  return (
    <div className="min-h-screen bg-[#080C14] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/about" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to About
          </Link>
          <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">Technical Overview · No code shared</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-16">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/30 rounded-full text-xs text-violet-400 font-medium">In Production</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">2 Months Build · Active</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">Legal Tech</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Mizan — Legal Case<br />
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Review Platform</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
            A purpose-built platform for legal case auditing and review, currently used by 10 lawyers in production. Mizan streamlines the entire case lifecycle — from intake and assignment to review, annotation, and decision — with built-in data governance aligned to legal standards.
          </p>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {IMPACT.map((item, i) => (
            <div key={i} className="p-6 bg-[#0D1120] border border-white/5 rounded-2xl text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">{item.metric}</p>
              <p className="text-slate-400 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        {/* My Role */}
        <div className="mb-16 p-8 bg-[#0D1120] border border-white/5 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">My Role</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            I designed and built Mizan end-to-end — from the initial architecture and data model through to the deployed production system. This included the full-stack implementation: database schema, backend API, frontend interface, and infrastructure setup. The platform went from concept to production in 2 months and is actively used by 10 lawyers for case auditing.
          </p>
        </div>

        {/* System Architecture */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">System Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TECH_STACK.map((layer, i) => (
              <div key={i} className="p-6 bg-[#0D1120] border border-white/5 rounded-2xl hover:border-white/10 transition">
                <div className="flex items-center gap-3 mb-4">
                  {layer.icon}
                  <h3 className="font-semibold text-white">{layer.layer}</h3>
                </div>
                <ul className="space-y-2">
                  {layer.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Key Contributions */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">What I Built</h2>
          <div className="space-y-6">
            {CONTRIBUTIONS.map((c, i) => (
              <div key={i} className="flex gap-5 p-6 bg-[#0D1120] border border-white/5 rounded-2xl hover:border-white/10 transition">
                <div className="flex-shrink-0 w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{c.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Governance Note */}
        <div className="mb-16 p-8 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Data Governance in a Legal Context</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">
            Legal platforms have strict requirements around data integrity and auditability. In Mizan, every case action is logged with a full audit trail — who did what, when, and what the previous state was. Role-based access control ensures that lawyers can only access cases assigned to them. Data retention and immutability rules prevent accidental or unauthorized deletion of case records. These governance decisions were made from day one of the architecture design, not added as an afterthought.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-[#0D1120] border border-white/5 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-3">Want to discuss this project?</h3>
          <p className="text-slate-400 text-sm mb-6">I'm happy to walk through the architecture, design decisions, and the challenges of building for legal professionals.</p>
          <a
            href="https://calendly.com/ayah-safeen/new-meeting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition font-medium"
          >
            Book a Discussion
          </a>
        </div>
      </div>
    </div>
  );
}

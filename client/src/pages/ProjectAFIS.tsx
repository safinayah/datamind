import { Link } from "wouter";
import {
  ArrowLeft, Database, Shield, Zap, Layers, GitBranch,
  Server, Monitor, Box, CheckCircle, Users, BarChart3
} from "lucide-react";

const TECH_STACK = [
  { layer: "Frontend", icon: <Monitor className="w-5 h-5 text-cyan-400" />, items: ["React", "TypeScript", "Konva.js (canvas image manipulation)", "Tailwind CSS"] },
  { layer: "Backend", icon: <Server className="w-5 h-5 text-violet-400" />, items: ["Spring Boot (Java 17)", "SourceAFIS Library", "RESTful API design", "Image processing pipeline"] },
  { layer: "Database", icon: <Database className="w-5 h-5 text-emerald-400" />, items: ["PostgreSQL", "Master fingerprint database", "Reference database (in progress)", "Custom schema for biometric data"] },
  { layer: "Infrastructure", icon: <Box className="w-5 h-5 text-orange-400" />, items: ["Docker Compose", "Multi-container orchestration", "Environment isolation", "Reproducible deployments"] },
];

const CONTRIBUTIONS = [
  {
    icon: <GitBranch className="w-5 h-5 text-cyan-400" />,
    title: "Image Registration Pipeline",
    desc: "Designed and implemented the full image registration flow — the process by which raw fingerprint images are ingested, validated, normalized, and stored in a format fully compatible with the SourceAFIS library specifications. This ensures every image in the system can be reliably matched.",
  },
  {
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    title: "Dynamic Ruler Mechanism",
    desc: "Built a custom ruler tool that handles latent fingerprints captured at different scales and resolutions. The ruler dynamically adjusts to the image's DPI and scale metadata, ensuring that fingerprint dimensions are normalized before matching — a critical step for accurate identification.",
  },
  {
    icon: <Database className="w-5 h-5 text-emerald-400" />,
    title: "Database Architecture",
    desc: "Architected the master database schema to store case records, fingerprint templates, and metadata. Designed with extensibility in mind — supporting multiple fingerprint types (rolled, flat, latent) and case statuses. Currently building the reference database that will serve as the matching pool.",
  },
  {
    icon: <Shield className="w-5 h-5 text-violet-400" />,
    title: "Data Quality & Governance",
    desc: "Owned the full case registration lifecycle — from UI form design through backend validation to database persistence. Implemented strict data completeness rules, field-level validation, and governance policies that align with the system's operational requirements and business goals.",
  },
  {
    icon: <Layers className="w-5 h-5 text-pink-400" />,
    title: "Frontend Image Manipulation",
    desc: "Built the image annotation interface using Konva.js, enabling operators to zoom, pan, crop, and mark fingerprint regions directly in the browser. This interface feeds directly into the registration pipeline, bridging the UI and backend data layer.",
  },
];

const CHALLENGES = [
  {
    challenge: "SourceAFIS Compatibility",
    solution: "SourceAFIS requires images in a very specific format (resolution, bit depth, DPI). I reverse-engineered the library's requirements and built a pre-processing pipeline that normalizes all incoming images before they reach the matching engine.",
  },
  {
    challenge: "Scale Variance in Latent Prints",
    solution: "Latent fingerprints are often captured at inconsistent scales. The dynamic ruler tool I designed reads image metadata and applies a scale normalization factor, ensuring the fingerprint template is always generated at a consistent DPI regardless of the source.",
  },
  {
    challenge: "Data Completeness for Legal Use",
    solution: "Biometric identification systems require strict data completeness — missing fields can invalidate a case. I designed a multi-layer validation system: form-level, API-level, and database-level constraints that together guarantee no incomplete case record can be persisted.",
  },
];

export default function ProjectAFIS() {
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
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">MVP · Active</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">Nov 2025 – Present</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">Team of 3</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Automated Fingerprint<br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Identification System</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
            A full-stack biometric identification system (AFIS) built as an MVP. The system enables operators to register fingerprint cases, manage a fingerprint database, and perform identification matching using the SourceAFIS library.
          </p>
        </div>

        {/* My Role */}
        <div className="mb-16 p-8 bg-[#0D1120] border border-white/5 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">My Role</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            As one of three team members, I owned the <strong className="text-white">entire data layer</strong> of the system — from the moment a fingerprint image is uploaded, through processing and normalization, to its final storage in the database. I also designed the master database schema, built the case registration system end-to-end, and am currently developing the reference database that will power the matching engine.
          </p>
        </div>

        {/* System Architecture Overview */}
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
          <h2 className="text-2xl font-bold text-white mb-8">Key Contributions</h2>
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

        {/* Technical Challenges */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Technical Challenges & Solutions</h2>
          <div className="space-y-4">
            {CHALLENGES.map((item, i) => (
              <div key={i} className="p-6 bg-[#0D1120] border border-white/5 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block w-6 h-6 bg-violet-600 rounded-full text-xs text-white flex items-center justify-center font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">{item.challenge}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Governance Note */}
        <div className="mb-16 p-8 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Data Governance Approach</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">
            Given the sensitive nature of biometric data, data governance was a first-class concern throughout the project. Every case record follows a strict completeness checklist before it can be committed to the database. Field-level constraints, API-level validation, and database-level integrity rules work together to ensure that no partial or ambiguous record can enter the system. The governance model was designed to align with the operational and legal requirements of biometric identification use cases.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-[#0D1120] border border-white/5 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-3">Interested in discussing this project?</h3>
          <p className="text-slate-400 text-sm mb-6">I'm happy to walk through the architecture, design decisions, and challenges in a conversation.</p>
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

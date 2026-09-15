import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Zap, Calendar, MessageCircle, CheckCircle, ArrowLeft, ExternalLink, Mail, X } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/ayah-safeen/new-meeting";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Get a taste of what DataMind AI can do",
    messages: 5,
    features: [
      "5 free messages",
      "All 3 conversation tones",
      "Ask about experience & projects",
      "Ask about services & pricing",
    ],
    cta: "Start Chatting",
    ctaLink: "/",
    highlight: false,
    color: "border-white/10",
    isInternal: true,
  },
  {
    name: "Starter Pack",
    price: "$5",
    period: "one-time",
    description: "For a focused deep-dive session",
    messages: 30,
    features: [
      "30 messages",
      "All 3 conversation tones",
      "Technical architecture questions",
      "Data governance topics",
      "Valid forever",
    ],
    cta: "Get Starter Pack",
    ctaLink: "mailto:ayah.safeen@gmail.com?subject=Starter Pack - 30 Messages&body=Hi Ayah, I'd like to purchase the Starter Pack (30 messages) for $5. Please send me a PayPal payment link.",
    highlight: false,
    color: "border-white/10",
    isInternal: false,
  },
  {
    name: "Pro Pack",
    price: "$15",
    period: "one-time",
    description: "For ongoing research & exploration",
    messages: 100,
    features: [
      "100 messages",
      "All 3 conversation tones",
      "Detailed technical deep-dives",
      "Architecture & cost analysis Q&A",
      "Deep-dive governance & quality questions",
      "Valid forever",
    ],
    cta: "Get Pro Pack",
    ctaLink: "mailto:ayah.safeen@gmail.com?subject=Pro Pack - 100 Messages&body=Hi Ayah, I'd like to purchase the Pro Pack (100 messages) for $15. Please send me a PayPal payment link.",
    highlight: true,
    color: "border-violet-500/50",
    isInternal: false,
  },
];

const CONSULTATION_SERVICES = [
  {
    name: "Architecture Review",
    duration: "90 min",
    description: "Deep dive into your current data architecture. Get actionable recommendations on structure, scalability, and cost.",
    price: "Contact for pricing",
    icon: "🏗️",
  },
  {
    name: "Cost Optimization Audit",
    duration: "2 hours",
    description: "Analyze your cloud/infrastructure costs and identify 30-80% savings opportunities through better architecture choices.",
    price: "Contact for pricing",
    icon: "💰",
  },
  {
    name: "Data Strategy Session",
    duration: "1.5 hours",
    description: "Define your data strategy, governance framework, and roadmap. Perfect for startups building from scratch.",
    price: "Contact for pricing",
    icon: "🗺️",
  },
  {
    name: "Mentorship Session",
    duration: "1 hour",
    description: "1-on-1 career guidance for data engineers and aspiring data architects. Career path planning, skill development, and technical mentorship.",
    price: "Contact for pricing",
    icon: "🎓",
  },
];

// Calendly inline widget component
function CalendlyWidget({ onClose }: { onClose?: () => void }) {
  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div
        className="calendly-inline-widget rounded-xl overflow-hidden"
        data-url={`${CALENDLY_URL}?hide_event_type_details=0&hide_gdpr_banner=1&background_color=0f172a&text_color=ffffff&primary_color=8b5cf6`}
        style={{ minWidth: "320px", height: "700px" }}
      />
    </div>
  );
}

export default function Pricing() {
  const [showCalendly, setShowCalendly] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-white font-semibold ml-2">Pricing & Booking</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 border border-violet-500/20 rounded-full text-violet-300 text-sm mb-6">
            <MessageCircle className="w-4 h-4" /> Chat & Consultation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent <span className="text-violet-400">Pricing</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Start for free. Upgrade when you need more. Or book a real 1-on-1 session for hands-on consultation.
          </p>
        </div>

        {/* Chat Plans */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">AI Chat Packs</h2>
          <p className="text-slate-400 text-sm mb-6">Ask DataMind AI about data architecture, governance, cloud costs, and more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border ${plan.color} bg-slate-900 p-6 flex flex-col ${plan.highlight ? "ring-1 ring-violet-500/30 shadow-lg shadow-violet-900/20" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-violet-600/10 border border-violet-500/20 rounded-lg mb-6">
                <Zap className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="text-violet-300 text-sm font-medium">{plan.messages} messages</span>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.isInternal ? (
                <Link
                  href={plan.ctaLink}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition block ${
                    plan.highlight
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <a
                  href={plan.ctaLink}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Consultation Services */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">1-on-1 Consultation Services</h2>
          <p className="text-slate-400 text-sm mb-6">Book a real 1-on-1 session for hands-on, personalised guidance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {CONSULTATION_SERVICES.map((service, i) => (
            <div key={i} className="p-5 rounded-xl border border-white/10 bg-slate-900 hover:border-emerald-500/30 transition group">
              <div className="flex items-start gap-4">
                <div className="text-2xl">{service.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{service.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">{service.duration}</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{service.description}</p>
                  <button
                    onClick={() => setShowCalendly(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book this session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Book Now CTA */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-slate-900 p-8 mb-16">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Book a Session?</h2>
              <p className="text-slate-400 mb-2">
                Schedule directly on Calendly. Sessions are tailored to your specific data challenges.
              </p>
              <p className="text-emerald-400 text-sm font-medium">Sessions are 1–2 hours · Flexible scheduling</p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowCalendly(!showCalendly)}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
              >
                <Calendar className="w-4 h-4" />
                {showCalendly ? "Hide Calendar" : "Book a Session"}
              </button>
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition text-sm border border-white/10"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Calendly
              </a>
            </div>
          </div>

          {/* Embedded Calendly */}
          {showCalendly && (
            <div className="mt-8">
              <CalendlyWidget onClose={() => setShowCalendly(false)} />
            </div>
          )}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-white text-center mb-8">Common Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: "How do I pay for a message pack?", a: "Click the plan button to open a pre-filled email to Ayah. She'll send a PayPal payment link and activate your messages once confirmed." },
              { q: "Do messages expire?", a: "No — purchased message packs are valid forever. Use them at your own pace." },
              { q: "What can the AI answer?", a: "Questions about Ayah's background, projects, skills, data architecture concepts, governance frameworks, cloud costs, and her services." },
              { q: "How do I book a consultation?", a: "Click 'Book a Session' above to see Ayah's calendar and pick a time that works for you. Sessions are confirmed via Calendly." },
              { q: "What payment methods are accepted?", a: "PayPal for international payments. For Palestinian clients, contact Ayah directly at ayah.safeen@gmail.com for local options." },
              { q: "Can I get a refund?", a: "Message packs are non-refundable once activated. Consultation sessions can be rescheduled up to 24 hours before the meeting." },
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/10 bg-slate-900">
                <p className="text-white font-medium mb-2">{faq.q}</p>
                <p className="text-slate-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

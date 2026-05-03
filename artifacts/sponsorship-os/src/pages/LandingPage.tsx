import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Brain, KanbanSquare, FileCheck, CreditCard, Calculator, MessageSquare, Sparkles } from "lucide-react";
import { FlowraFull } from "@/components/FlowraLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden">
      {/* ═══ Background Atmosphere ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="ambient-orb ambient-orb-amber w-[600px] h-[600px] -top-40 -right-40 absolute animate-pulse-glow" />
        <div className="ambient-orb ambient-orb-lime w-[500px] h-[500px] top-[60%] -left-60 absolute animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="ambient-orb ambient-orb-amber w-[400px] h-[400px] bottom-20 right-[20%] absolute animate-pulse-glow" style={{ animationDelay: '4s' }} />
      </div>

      {/* ═══ Navbar ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center justify-between">
          <FlowraFull className="flex items-center gap-2.5" />
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-500">
              Sign In
            </Link>
            <Link href="/signup">
              <Button className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-10 text-sm font-semibold rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ═══ 1. HERO ═══ */}
        <section className="pt-40 pb-32 px-8">
          <div className="max-w-[1440px] mx-auto text-center">
            <div className="animate-fade-in-up">
              <p className="text-label mb-6">CREATOR REVENUE OPERATIONS</p>
              <h1 className="font-editorial text-6xl md:text-8xl lg:text-[96px] font-light leading-[0.95] tracking-tight mb-8">
                Run sponsorships<br />
                <span className="italic text-primary">like a business.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12 font-light">
                Upload a contract. Flowra extracts the obligations, builds your milestone board,
                tracks deadlines, verifies deliverables, generates sponsor reports, and helps you get paid.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-14 text-base font-semibold rounded-lg">
                    Start managing contracts <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#workflow" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-500 px-6 py-4">
                  View workflow →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 2. THE PROBLEM ═══ */}
        <section className="py-32 px-8 border-t border-white/[0.04]">
          <div className="max-w-[1440px] mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-label mb-6">THE CREATOR BACK-OFFICE PROBLEM</p>
              <h2 className="font-editorial text-4xl md:text-5xl font-light leading-tight mb-8">
                Contracts scattered. Deadlines missed.<br />
                <span className="text-muted-foreground italic">Revenue leaked.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Sponsorship contracts live across PDFs, emails, DMs, and spreadsheets.
                Creators miss posting deadlines, forget deliverables, under-invoice brands,
                fail to reserve tax, and struggle to prove performance to sponsors.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 3. CONTRACT INTELLIGENCE ═══ */}
        <section id="workflow" className="py-32 px-8 border-t border-white/[0.04]">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <p className="text-label mb-4">01 — CONTRACT INTELLIGENCE</p>
                <h2 className="font-editorial text-4xl md:text-5xl font-light leading-tight mb-6">
                  Upload a PDF.<br />
                  <span className="text-primary italic">AI does the rest.</span>
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  Flowra's AI reads your sponsorship contract and extracts every obligation—deliverables,
                  deadlines, payment terms, hashtags, usage rights, and risk flags—into structured data you can edit and act on.
                </p>
                <div className="space-y-3 font-mono text-sm text-muted-foreground">
                  <div className="flex items-center gap-3"><span className="status-dot status-dot-active" /> Brand name, payment schedule, platforms</div>
                  <div className="flex items-center gap-3"><span className="status-dot status-dot-active" /> Required hashtags, mentions, links</div>
                  <div className="flex items-center gap-3"><span className="status-dot status-dot-warning" /> Risk flags with severity scores</div>
                </div>
              </div>
              <div className="glass-card glow-amber p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
                    <span className="text-label">CONTRACT EXTRACTION</span>
                    <span className="text-xs font-mono text-accent">AI COMPLETE</span>
                  </div>
                  {[
                    { label: 'Brand', value: 'Acme Corp' },
                    { label: 'Total Payment', value: '$12,500 USD' },
                    { label: 'Deliverables', value: '3 YouTube + 2 TikTok' },
                    { label: 'Deadline', value: '2026-06-15' },
                    { label: 'Risk Flags', value: '2 medium' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-mono text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4. MILESTONE COMMAND BOARD ═══ */}
        <section className="py-32 px-8 border-t border-white/[0.04]">
          <div className="max-w-[1440px] mx-auto text-center">
            <p className="text-label mb-4">02 — MILESTONE COMMAND BOARD</p>
            <h2 className="font-editorial text-4xl md:text-5xl font-light leading-tight mb-6">
              Every obligation, <span className="text-primary italic">tracked.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
              Auto-generated milestones from contract data. Drag across workflow stages.
              Never miss a deadline or deliverable again.
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { stage: 'CONTENT DUE', count: 3, color: 'text-primary' },
                { stage: 'POSTED', count: 2, color: 'text-accent' },
                { stage: 'PAID', count: 5, color: 'text-foreground' },
              ].map((col) => (
                <div key={col.stage} className="glass-card p-6 text-left">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-label">{col.stage}</span>
                    <span className={`font-mono text-2xl font-semibold ${col.color}`}>{col.count}</span>
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                        <div className="h-2 w-3/4 bg-white/[0.08] rounded mb-2" />
                        <div className="h-2 w-1/2 bg-white/[0.05] rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 5. PERFORMANCE REPORTS ═══ */}
        <section className="py-32 px-8 border-t border-white/[0.04]">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="glass-card glow-lime p-8">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-6">
                  <span className="text-label">PROOF-OF-PERFORMANCE REPORT</span>
                  <span className="text-xs font-mono text-accent">SPONSOR READY</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-lg bg-white/[0.03] p-4 text-center">
                    <div className="font-mono text-3xl font-bold text-accent mb-1">94%</div>
                    <div className="text-label">COMPLIANCE</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-4 text-center">
                    <div className="font-mono text-3xl font-bold text-foreground mb-1">5/5</div>
                    <div className="text-label">DELIVERABLES</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-accent" /> All hashtags verified</div>
                  <div className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-accent" /> All mentions present</div>
                  <div className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-primary" /> 1 link needs review</div>
                </div>
              </div>
              <div>
                <p className="text-label mb-4">03 — PROOF-OF-PERFORMANCE</p>
                <h2 className="font-editorial text-4xl md:text-5xl font-light leading-tight mb-6">
                  Sponsor-ready reports,<br />
                  <span className="text-accent italic">auto-generated.</span>
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Flowra verifies your posted content against contract requirements—hashtags, mentions, links—and
                  generates a clean compliance report you can share directly with sponsors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 6. PAYSTACK INVOICING ═══ */}
        <section className="py-32 px-8 border-t border-white/[0.04]">
          <div className="max-w-[1440px] mx-auto text-center">
            <p className="text-label mb-4">04 — INVOICING & PAYMENTS</p>
            <h2 className="font-editorial text-4xl md:text-5xl font-light leading-tight mb-6">
              Invoice brands. <span className="text-primary italic">Get paid.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
              Generate Paystack-powered payment links for each milestone.
              Track payment status in real-time. Know exactly what's owed and what's cleared.
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto stagger-children">
              {[
                { icon: CreditCard, title: 'Payment Links', desc: 'One-click Paystack invoices sent to brands' },
                { icon: FileCheck, title: 'Auto-Verification', desc: 'Webhooks update invoice status instantly' },
                { icon: Calculator, title: 'Tax Reserve', desc: '30% default set aside for tax obligations' },
              ].map((item) => (
                <div key={item.title} className="glass-card p-8 text-left">
                  <item.icon className="h-8 w-8 text-primary mb-6" />
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. TAX RESERVE ═══ */}
        <section className="py-32 px-8 border-t border-white/[0.04]">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <p className="text-label mb-4">05 — TAX RESERVE DASHBOARD</p>
                <h2 className="font-editorial text-4xl md:text-5xl font-light leading-tight mb-6">
                  Never get caught<br />
                  <span className="text-primary italic">at tax time.</span>
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Flowra automatically calculates your tax reserve on every paid invoice.
                  See gross income, net income, and reserved amounts at a glance.
                  Default 30%—fully configurable.
                </p>
              </div>
              <div className="glass-card p-8">
                <div className="space-y-6">
                  {[
                    { label: 'GROSS INCOME', value: '$42,500', sub: 'YTD' },
                    { label: 'TAX RESERVE (30%)', value: '$12,750', sub: 'SET ASIDE' },
                    { label: 'AVAILABLE', value: '$29,750', sub: 'AFTER TAX' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-3 border-b border-white/[0.04] last:border-0">
                      <div>
                        <div className="text-label mb-1">{item.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.sub}</div>
                      </div>
                      <div className="font-mono text-2xl font-semibold">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 8. BRAND SENTIMENT ═══ */}
        <section className="py-32 px-8 border-t border-white/[0.04]">
          <div className="max-w-[1440px] mx-auto text-center">
            <p className="text-label mb-4">06 — BRAND SENTIMENT INTELLIGENCE</p>
            <h2 className="font-editorial text-4xl md:text-5xl font-light leading-tight mb-6">
              Read between <span className="text-accent italic">the lines.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
              Paste brand communications and Flowra's AI analyzes sentiment, urgency,
              scope creep risk, and payment risk—then suggests your next move.
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="glass-card p-6 text-left">
                <MessageSquare className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Sentiment Analysis</h3>
                <p className="text-sm text-muted-foreground">Detect payment risk, scope creep, and tone shifts before they become problems.</p>
              </div>
              <div className="glass-card p-6 text-left">
                <Sparkles className="h-6 w-6 text-accent mb-4" />
                <h3 className="font-semibold mb-2">AI Response Drafts</h3>
                <p className="text-sm text-muted-foreground">Get suggested replies and action items tailored to the conversation context.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 9. FINAL CTA ═══ */}
        <section className="py-40 px-8 border-t border-white/[0.04] relative">
          <div className="ambient-orb ambient-orb-amber w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute" />
          <div className="max-w-[1440px] mx-auto text-center relative z-10">
            <h2 className="font-editorial text-5xl md:text-7xl font-light leading-tight mb-8">
              Your sponsorships<br />
              deserve <span className="text-primary italic">structure.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-12">
              Join creators who run their brand deals like a real business.
            </p>
            <Link href="/signup">
              <Button className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 px-10 h-16 text-lg font-semibold rounded-lg">
                Start managing contracts <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/[0.06] py-12 relative z-10">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <FlowraFull className="flex items-center gap-2" />
          <p className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} FLOWRA. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}

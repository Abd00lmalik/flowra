import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, BarChart3, CheckCircle2 } from "lucide-react";
import { FlowraFull, FlowraLogo } from "@/components/FlowraLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-primary hover:opacity-80 transition-opacity">
          <FlowraFull className="flex items-center gap-3" />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="container mx-auto px-6 py-24 md:py-32 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            The back-office for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">creator deals</span>.
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Streamline your creator business. Flowra extracts contract data, tracks milestones, and generates performance reports for brand deals—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors px-6 py-4">
              View Pricing
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-card py-24 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to scale</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Built specifically for YouTube, TikTok, and Instagram creators who treat their channels like a business.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="p-6 rounded-2xl bg-background border border-border flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Extraction</h3>
                <p className="text-muted-foreground text-sm">
                  Upload your PDF contracts. We extract deliverables, payment terms, and deadlines instantly.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Compliance Checks</h3>
                <p className="text-muted-foreground text-sm">
                  Automatically verify that your live videos include the required links, mentions, and hashtags.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Performance Reports</h3>
                <p className="text-muted-foreground text-sm">
                  Generate beautiful, sponsor-facing reports with live view counts and engagement metrics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl border border-border bg-card flex flex-col">
              <h3 className="text-2xl font-semibold mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Up to 2 active contracts</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Basic AI extraction</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Milestone tracking</li>
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            
            <div className="p-8 rounded-2xl border-2 border-primary bg-card flex flex-col relative transform md:-translate-y-4 shadow-xl shadow-primary/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-2xl font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">$29<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-3 text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Unlimited contracts</li>
                <li className="flex items-center gap-3 text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Advanced AI with Risk Flags</li>
                <li className="flex items-center gap-3 text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Performance Reports</li>
                <li className="flex items-center gap-3 text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Automated YouTube compliance</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card flex flex-col">
              <h3 className="text-2xl font-semibold mb-2">Agency</h3>
              <div className="text-4xl font-bold mb-6">Custom</div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Multiple creators</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> API access</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Custom branding</li>
              </ul>
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Flowra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

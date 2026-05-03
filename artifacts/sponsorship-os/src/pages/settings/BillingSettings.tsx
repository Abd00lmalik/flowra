import { useEffect } from "react";
import { useGetProfile, useCreateCheckoutSession, useGetBillingPortal } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Zap, Star, Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowraLogo } from "@/components/FlowraLogo";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for getting started",
    icon: Zap,
    features: ["Up to 5 contracts/month", "AI extraction", "Basic milestones", "Manual invoicing", "Tax reserve tracking"],
    cta: "Current Plan",
    planKey: "starter",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For full-time creators",
    icon: Star,
    features: ["Unlimited contracts", "Priority AI processing", "Paystack invoicing", "Performance reports", "Email reminders", "Notion exports", "Sentiment analysis"],
    cta: "Upgrade to Pro",
    planKey: "pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/mo",
    description: "For agencies and teams",
    icon: Building2,
    features: ["Everything in Pro", "Multiple creator profiles", "1% platform fee on invoices", "Priority support", "Custom integrations", "White-label reports"],
    cta: "Contact Sales",
    planKey: "agency",
  },
];

export default function BillingSettings() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useGetProfile();
  const checkoutMutation = useCreateCheckoutSession();
  const { refetch: getPortal, isFetching: isPortalLoading } = useGetBillingPortal({ query: { enabled: false } as any });

  const currentPlan = (profile as any)?.subscriptionPlan || "starter";
  const subStatus = (profile as any)?.subscriptionStatus;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({ title: "Subscription activated!", description: "Welcome to Flowra Pro." });
    }
    if (params.get("cancelled") === "true") {
      toast({ title: "Checkout cancelled", variant: "destructive" });
    }
  }, []);

  const handleUpgrade = () => {
    checkoutMutation.mutate(undefined, {
      onSuccess: (res: any) => {
        if (res?.url) window.location.href = res.url;
      },
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  const handlePortal = async () => {
    const { data } = await getPortal();
    if ((data as any)?.url) window.location.href = (data as any).url;
    else toast({ title: "Failed to open billing portal", variant: "destructive" });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <p className="text-label mb-2">SUBSCRIPTION</p>
        <h1 className="font-editorial text-4xl font-light">Billing & Plans</h1>
        <p className="text-sm text-muted-foreground mt-2">Manage your plan and payment method.</p>
      </div>

      {/* Current plan banner */}
      {currentPlan !== "starter" && (
        <div className="glass-card border-primary/20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold capitalize">{currentPlan} Plan</p>
              <p className="text-xs text-muted-foreground font-mono uppercase">STATUS: {subStatus || "active"}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePortal}
            disabled={isPortalLoading}
            className="border-white/[0.1] hover:bg-white/[0.04] text-sm"
          >
            {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
            Manage Subscription
          </Button>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrentPlan = currentPlan === plan.planKey;
          return (
            <div
              key={plan.name}
              className={`glass-card flex flex-col relative transition-all duration-700 ${
                plan.highlighted ? "border-primary/40 glow-amber" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-mono bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <plan.icon className={`h-5 w-5 ${plan.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-label">{plan.name.toUpperCase()}</span>
                </div>
                <div className="mb-2">
                  <span className="font-mono text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>
              <div className="flex-1 px-6 pb-6 space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-11 rounded-lg text-sm font-semibold ${
                    plan.highlighted
                      ? "btn-glow bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white/[0.04] text-foreground hover:bg-white/[0.08] border border-white/[0.08]"
                  }`}
                  disabled={isCurrentPlan || checkoutMutation.isPending}
                  onClick={plan.planKey === "pro" ? handleUpgrade : undefined}
                >
                  {checkoutMutation.isPending && plan.planKey === "pro" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCurrentPlan ? "CURRENT PLAN" : plan.cta.toUpperCase()}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground font-mono">
        ALL PRICES IN USD · CANCEL ANYTIME · POWERED BY PAYSTACK
      </p>
    </div>
  );
}

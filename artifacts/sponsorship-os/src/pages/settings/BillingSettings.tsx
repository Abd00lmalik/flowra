import { useEffect } from "react";
import { useGetProfile, useCreateCheckoutSession, useGetBillingPortal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Zap, Star, Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for getting started",
    icon: Zap,
    features: ["Up to 5 contracts/month", "AI extraction", "Basic milestones", "Manual invoicing", "Tax reserve tracking"],
    cta: "Current Plan",
    planKey: "starter",
  },
  {
    name: "Pro",
    price: "$29/mo",
    description: "For full-time creators",
    icon: Star,
    features: ["Unlimited contracts", "Priority AI processing", "Paystack invoicing", "Performance reports", "Email reminders", "Notion exports", "Sentiment analysis"],
    cta: "Upgrade to Pro",
    planKey: "pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$99/mo",
    description: "For agencies and teams",
    icon: Building2,
    features: ["Everything in Pro", "Multiple creator profiles", "1% platform fee on invoices (vs 0%)", "Priority support", "Custom integrations", "White-label reports"],
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
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and payment method.</p>
      </div>

      {currentPlan !== "starter" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold capitalize">{currentPlan} Plan</p>
                <p className="text-xs text-muted-foreground capitalize">Status: {subStatus || "active"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={isPortalLoading}>
              {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrentPlan = currentPlan === plan.planKey;
          return (
            <Card key={plan.name} className={`relative flex flex-col ${plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : ""}`}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <plan.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black">{plan.price}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-auto"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={isCurrentPlan || checkoutMutation.isPending}
                  onClick={plan.planKey === "pro" ? handleUpgrade : undefined}
                >
                  {checkoutMutation.isPending && plan.planKey === "pro" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCurrentPlan ? "Current Plan" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        All prices in USD. Cancel anytime. Powered by Paystack.
      </p>
    </div>
  );
}

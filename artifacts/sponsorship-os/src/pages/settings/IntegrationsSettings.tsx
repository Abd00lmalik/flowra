import { useGetIntegrations, useDisconnectIntegration } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink, Unplug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { FlowraLogo } from "@/components/FlowraLogo";

const INTEGRATIONS = [
  {
    key: "youtube",
    name: "YouTube",
    description: "Connect your channel to enable automatic compliance checking — the AI verifies hashtags, mentions, and links directly in your video descriptions.",
    authUrl: "/api/auth/youtube",
    icon: "▶️",
  },
  {
    key: "tiktok",
    name: "TikTok",
    description: "Connect TikTok to verify that your sponsored content includes all required hashtags and disclosures. Requires TikTok Developer approval.",
    authUrl: "/api/auth/tiktok",
    icon: "🎵",
  },
  {
    key: "paystack",
    name: "Paystack",
    description: "Automatically create and send professional invoices to brand partners. Payments tracked in real-time via webhooks.",
    authUrl: null,
    icon: "💳",
  },
  {
    key: "notion",
    name: "Notion",
    description: "Export contract summaries, milestones, and reports directly to your Notion workspace.",
    authUrl: null,
    icon: "📝",
  },
  {
    key: "resend",
    name: "Email (Resend)",
    description: "Automated deadline reminders sent to your inbox before milestones are due. Requires Resend API key and FROM_EMAIL.",
    authUrl: null,
    icon: "📧",
  },
];

export default function IntegrationsSettings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: integrations, isLoading, refetch } = useGetIntegrations();
  const disconnectMutation = useDisconnectIntegration();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      toast({ title: `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!` });
      refetch();
      setLocation("/app/settings/integrations");
    }
    if (error) {
      toast({ title: "Connection failed", description: "Check your API credentials and try again.", variant: "destructive" });
      setLocation("/app/settings/integrations");
    }
  }, []);

  const handleDisconnect = (provider: string) => {
    disconnectMutation.mutate(
      { provider: provider as "youtube" | "tiktok" | "notion" | "paystack" },
      {
        onSuccess: () => { toast({ title: `${provider} disconnected` }); refetch(); },
        onError: () => toast({ title: "Disconnect failed", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const data = (integrations as any) || {};

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <p className="text-label mb-2">PLATFORM CONNECTIONS</p>
        <h1 className="font-editorial text-4xl font-light">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-2">Connect your platforms to unlock the full power of Flowra.</p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map(integration => {
          const info = data[integration.key] || {};
          const status: string = info.status || "requires_setup";
          const isConnected = status === "connected";
          const needsSetup = status === "requires_setup";
          const notConnected = status === "not_connected";

          return (
            <div
              key={integration.key}
              className={`glass-card p-5 transition-all duration-500 ${
                isConnected ? "border-accent/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{integration.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm">{integration.name}</h3>
                      {isConnected && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                          CONNECTED
                        </span>
                      )}
                      {notConnected && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
                          NOT CONNECTED
                        </span>
                      )}
                      {needsSetup && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          SETUP REQUIRED
                        </span>
                      )}
                    </div>
                    {info.accountName && (
                      <p className="text-xs text-muted-foreground font-mono mb-1">
                        {info.accountName}{info.accountDetails && ` · ${info.accountDetails}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
                    {info.setupInstructions && (
                      <div className="mt-3 bg-white/[0.02] rounded-lg p-3 text-xs text-muted-foreground font-mono whitespace-pre-line border border-white/[0.04]">
                        {info.setupInstructions}
                      </div>
                    )}
                    {info.errorMessage && (
                      <div className="mt-3 bg-destructive/10 text-destructive rounded-lg p-3 text-xs flex items-start gap-2 border border-destructive/20">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {info.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {isConnected && (
                    <button
                      className="text-xs font-mono text-muted-foreground hover:text-destructive transition-colors duration-500"
                      onClick={() => handleDisconnect(integration.key)}
                      disabled={disconnectMutation.isPending}
                    >
                      DISCONNECT
                    </button>
                  )}
                  {notConnected && integration.authUrl && (
                    <a
                      href={integration.authUrl}
                      className="text-xs font-mono bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors duration-500 font-semibold"
                    >
                      CONNECT
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

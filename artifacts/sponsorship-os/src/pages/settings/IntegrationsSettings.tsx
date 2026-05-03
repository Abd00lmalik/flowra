import { useGetIntegrations, useDisconnectIntegration } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink, Unplug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useLocation } from "wouter";

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
    key: "stripe",
    name: "Stripe",
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
      { provider: provider as "youtube" | "tiktok" | "notion" | "stripe" },
      {
        onSuccess: () => { toast({ title: `${provider} disconnected` }); refetch(); },
        onError: () => toast({ title: "Disconnect failed", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const data = (integrations as any) || {};

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect your platforms to unlock the full power of Flowra.</p>
      </div>

      <div className="space-y-4">
        {INTEGRATIONS.map(integration => {
          const info = data[integration.key] || {};
          const status: string = info.status || "requires_setup";
          const isConnected = status === "connected";
          const needsSetup = status === "requires_setup";
          const notConnected = status === "not_connected";

          return (
            <Card key={integration.key} className={isConnected ? "border-green-500/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{integration.icon}</span>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {integration.name}
                        {isConnected && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Connected
                          </Badge>
                        )}
                        {notConnected && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Not connected</Badge>
                        )}
                        {needsSetup && (
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                            <AlertCircle className="h-3 w-3 mr-1" />Setup required
                          </Badge>
                        )}
                      </CardTitle>
                      {info.accountName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {info.accountName}{info.accountDetails && ` · ${info.accountDetails}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {isConnected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDisconnect(integration.key)}
                        disabled={disconnectMutation.isPending}
                      >
                        <Unplug className="h-4 w-4 mr-1" />Disconnect
                      </Button>
                    )}
                    {notConnected && integration.authUrl && (
                      <Button size="sm" asChild>
                        <a href={integration.authUrl}>
                          <ExternalLink className="h-4 w-4 mr-1" />Connect
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-2">
                <CardDescription>{integration.description}</CardDescription>
                {info.setupInstructions && (
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-line border border-border/50">
                    {info.setupInstructions}
                  </div>
                )}
                {info.errorMessage && (
                  <div className="bg-red-500/10 text-red-400 rounded-lg p-3 text-xs flex items-start gap-2">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {info.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useGetApiStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";

const API_KEYS = [
  { key: "anthropic", label: "Anthropic Claude", description: "Powers AI contract extraction, sentiment analysis, and performance reports.", envVar: "ANTHROPIC_API_KEY", required: true },
  { key: "stripe", label: "Stripe", description: "Handles invoice creation, payment tracking, and subscriptions.", envVar: "STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY + STRIPE_WEBHOOK_SECRET", required: false },
  { key: "resend", label: "Resend Email", description: "Sends deadline reminder emails to your inbox.", envVar: "RESEND_API_KEY + FROM_EMAIL", required: false },
  { key: "youtubeClient", label: "YouTube API", description: "Fetches your channel data and verifies content compliance.", envVar: "YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET", required: false },
  { key: "tiktokClient", label: "TikTok API", description: "TikTok content compliance verification.", envVar: "TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET", required: false },
  { key: "notion", label: "Notion", description: "Exports contracts, milestones, and reports to Notion.", envVar: "NOTION_API_KEY", required: false },
];

export default function ApiSettings() {
  const { data: status, isLoading } = useGetApiStatus();
  const s = (status as any) || {};

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Status</h1>
        <p className="text-muted-foreground mt-1">View the status of your configured API keys and integrations.</p>
      </div>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            API keys and secrets are configured as environment variables in your deployment settings. They are never exposed in the browser.
            To add or update a key, update your environment variables and redeploy.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {API_KEYS.map(api => {
          const isConfigured = s[api.key] === true;
          return (
            <Card key={api.key} className={isConfigured ? "border-green-500/20" : api.required ? "border-red-500/20" : "border-border"}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{api.label}</p>
                      {api.required && !isConfigured && (
                        <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{api.description}</p>
                    <code className="text-xs text-primary/70 mt-1 block">{api.envVar}</code>
                  </div>
                  <div className="shrink-0">
                    {isConfigured ? (
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />Not set
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overall Health</CardTitle>
          <CardDescription>Core functionality availability based on configured keys.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { label: "AI Contract Extraction", available: s.anthropic, dep: "Anthropic" },
              { label: "AI Sentiment Analysis", available: s.anthropic, dep: "Anthropic" },
              { label: "AI Performance Reports", available: s.anthropic, dep: "Anthropic" },
              { label: "Stripe Invoicing", available: s.stripe, dep: "Stripe" },
              { label: "Email Reminders", available: s.resend, dep: "Resend" },
              { label: "YouTube Compliance Check", available: s.youtubeClient, dep: "YouTube API" },
              { label: "Notion Export", available: s.notion, dep: "Notion" },
            ].map(feature => (
              <div key={feature.label} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <span>{feature.label}</span>
                {feature.available ? (
                  <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle2 className="h-3 w-3" />Available</span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground text-xs"><XCircle className="h-3 w-3" />Needs {feature.dep}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

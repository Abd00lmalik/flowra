import { useGetApiStatus } from "@workspace/api-client-react";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { FlowraLogo } from "@/components/FlowraLogo";

const API_KEYS = [
  { key: "anthropic", label: "Anthropic Claude", description: "Powers AI contract extraction, sentiment analysis, and performance reports.", envVar: "ANTHROPIC_API_KEY", required: true },
  { key: "paystack", label: "Paystack", description: "Handles invoice creation, payment tracking, and subscriptions.", envVar: "PAYSTACK_SECRET_KEY + PAYSTACK_PUBLIC_KEY", required: false },
  { key: "resend", label: "Resend Email", description: "Sends deadline reminder emails to your inbox.", envVar: "RESEND_API_KEY + FROM_EMAIL", required: false },
  { key: "youtubeClient", label: "YouTube API", description: "Fetches your channel data and verifies content compliance.", envVar: "YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET", required: false },
  { key: "tiktokClient", label: "TikTok API", description: "TikTok content compliance verification.", envVar: "TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET", required: false },
  { key: "notion", label: "Notion", description: "Exports contracts, milestones, and reports to Notion.", envVar: "NOTION_API_KEY", required: false },
];

export default function ApiSettings() {
  const { data: status, isLoading } = useGetApiStatus();
  const s = (status as any) || {};

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    { label: "AI Contract Extraction", available: s.anthropic, dep: "Anthropic" },
    { label: "AI Sentiment Analysis", available: s.anthropic, dep: "Anthropic" },
    { label: "AI Performance Reports", available: s.anthropic, dep: "Anthropic" },
    { label: "Paystack Invoicing", available: s.paystack, dep: "Paystack" },
    { label: "Email Reminders", available: s.resend, dep: "Resend" },
    { label: "YouTube Compliance Check", available: s.youtubeClient, dep: "YouTube API" },
    { label: "Notion Export", available: s.notion, dep: "Notion" },
  ];

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <p className="text-label mb-2">SYSTEM STATUS</p>
        <h1 className="font-editorial text-4xl font-light">API Configuration</h1>
        <p className="text-sm text-muted-foreground mt-2">View the status of your configured API keys and integrations.</p>
      </div>

      {/* Info banner */}
      <div className="glass-card border-primary/15 p-5 flex gap-4">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          API keys and secrets are configured as environment variables in your deployment settings.
          They are never exposed in the browser. To add or update a key, update your environment variables and redeploy.
        </p>
      </div>

      {/* API Keys */}
      <div className="space-y-2">
        <p className="text-label mb-3">API KEYS</p>
        {API_KEYS.map(api => {
          const isConfigured = s[api.key] === true;
          return (
            <div
              key={api.key}
              className={`glass-card p-4 transition-all duration-500 ${
                isConfigured ? "border-accent/15" : api.required ? "border-destructive/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{api.label}</p>
                    {api.required && !isConfigured && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{api.description}</p>
                  <code className="text-xs text-primary/60 mt-1 block font-mono">{api.envVar}</code>
                </div>
                <div className="shrink-0">
                  {isConfigured ? (
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> OK
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/[0.04] text-muted-foreground border border-white/[0.06] flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> NOT SET
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Health */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <p className="text-label mb-1">FEATURE AVAILABILITY</p>
          <p className="text-xs text-muted-foreground">Core functionality status based on configured keys.</p>
        </div>
        <div className="space-y-1">
          {features.map(feature => (
            <div key={feature.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <span className="text-sm">{feature.label}</span>
              {feature.available ? (
                <span className="flex items-center gap-1.5 text-accent text-xs font-mono">
                  <span className="status-dot status-dot-active" /> AVAILABLE
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono">
                  <span className="status-dot status-dot-neutral" /> NEEDS {feature.dep.toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

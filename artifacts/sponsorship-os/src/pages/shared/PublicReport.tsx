import { useParams } from "wouter";
import { useGetPublicReport } from "@workspace/api-client-react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { FlowraLogo } from "@/components/FlowraLogo";

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const { data: report, isLoading, isError } = useGetPublicReport(token!, { query: { enabled: !!token } as any });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <FlowraLogo className="w-12 h-12 animate-float mb-4" />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-mono text-muted-foreground mt-4 animate-pulse">LOADING REPORT...</p>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4 max-w-md p-8 glass-card border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="font-editorial text-3xl font-light">Report Not Found</h1>
          <p className="text-sm font-mono text-muted-foreground">THIS REPORT LINK MAY BE INVALID OR EXPIRED.</p>
        </div>
      </div>
    );
  }

  const r = report as any;
  const reportData = r.reportData as any;
  const score = r.complianceScore ?? reportData?.overall_compliance_score ?? 0;

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-primary/30">
      {/* Header */}
      <div className="border-b border-white/[0.05] bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FlowraLogo className="w-8 h-8" />
            <div className="h-4 w-px bg-white/[0.1]" />
            <span className="text-xs font-mono px-2.5 py-1 rounded border bg-white/[0.02] border-white/[0.1] uppercase tracking-widest text-muted-foreground">
              SHARED REPORT
            </span>
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            GENERATED {new Date(r.generatedAt || r.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 animate-fade-in-up">
        {/* Title + score */}
        <div className="text-center space-y-6 py-10 relative">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <p className="text-sm text-primary font-mono tracking-widest mb-4">
              {r.brandName?.toUpperCase() || "BRAND"} × {r.campaignName?.toUpperCase() || "CAMPAIGN"}
            </p>
            <h1 className="font-editorial text-5xl md:text-6xl font-light mb-8">Performance Report</h1>
            <div className={`text-8xl md:text-9xl font-mono font-light tracking-tighter ${score >= 80 ? "text-accent text-shadow-accent" : score >= 50 ? "text-primary text-shadow-primary" : "text-destructive text-shadow-destructive"}`}>
              {score}<span className="text-4xl text-muted-foreground">%</span>
            </div>
            <p className="text-sm font-mono text-muted-foreground mt-4 tracking-widest uppercase">OVERALL COMPLIANCE SCORE</p>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Executive Summary */}
          {reportData?.executive_summary && (
            <div className="glass-card p-8">
              <h3 className="text-label mb-4">EXECUTIVE SUMMARY</h3>
              <p className="leading-relaxed text-muted-foreground text-sm sm:text-base">{reportData.executive_summary}</p>
            </div>
          )}

          {/* Campaign Overview */}
          {reportData?.campaign_overview && (
            <div className="glass-card p-8">
              <h3 className="text-label mb-6">CAMPAIGN OVERVIEW</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                {Object.entries(reportData.campaign_overview).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs font-mono text-muted-foreground mb-2">{key.replace(/_/g, " ").toUpperCase()}</p>
                    <p className="font-semibold text-sm sm:text-base">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliverable Results */}
          {Array.isArray(reportData?.deliverable_results) && reportData.deliverable_results.length > 0 && (
            <div className="glass-card p-8">
              <h3 className="text-label mb-6">DELIVERABLE COMPLIANCE</h3>
              <div className="space-y-4">
                {reportData.deliverable_results.map((d: any, i: number) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 transition-colors hover:bg-white/[0.03]">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-semibold text-lg mb-2">{d.title}</p>
                        {d.platform && <span className="text-xs font-mono px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08]">{d.platform}</span>}
                      </div>
                      {d.status && (
                        <span className={`text-xs font-mono px-3 py-1.5 rounded flex items-center gap-2 border w-fit shrink-0 ${d.status === "compliant" ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                          {d.status === "compliant" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {d.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      {d.content_url && (
                        <a href={d.content_url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary flex items-center gap-2 hover:underline bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 w-fit">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{d.content_url}</span>
                        </a>
                      )}
                      
                      {Array.isArray(d.hashtags_missing) && d.hashtags_missing.length > 0 && (
                        <div className="text-xs font-mono text-destructive flex items-center gap-2 bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>MISSING HASHTAGS: {d.hashtags_missing.join(", ")}</span>
                        </div>
                      )}
                      
                      {Array.isArray(d.hashtags_found) && d.hashtags_found.length > 0 && (
                        <div className="text-xs font-mono text-accent flex items-center gap-2 bg-accent/5 px-3 py-2 rounded-lg border border-accent/10">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>FOUND: {d.hashtags_found.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {reportData?.recommendations && (
            <div className="glass-card p-8 border-primary/20 bg-primary/5">
              <h3 className="text-label text-primary mb-4">RECOMMENDATIONS</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{reportData.recommendations}</p>
            </div>
          )}
        </div>

        <div className="pt-12 pb-8 flex flex-col items-center justify-center text-center opacity-50">
          <FlowraLogo className="w-8 h-8 mb-4 grayscale" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest">
            POWERED BY FLOWRA
          </p>
        </div>
      </div>
    </div>
  );
}

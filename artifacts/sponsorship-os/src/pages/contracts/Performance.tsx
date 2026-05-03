import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGeneratePerformanceReport, useGetPerformanceReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart2, CheckCircle2, XCircle, AlertCircle, ExternalLink, Share2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowraLogo } from "@/components/FlowraLogo";

export default function Performance() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const { data: report, isLoading, refetch } = useGetPerformanceReport(id!, { query: { enabled: !!id } as any });
  const generateMutation = useGeneratePerformanceReport();

  const handleGenerate = () => {
    setGenerating(true);
    generateMutation.mutate(
      { contractId: id! },
      {
        onSuccess: () => { refetch(); setGenerating(false); },
        onError: (err: any) => {
          setGenerating(false);
          toast({ title: "Failed to generate report", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleCopyShareLink = () => {
    const token = (report as any)?.sharedToken;
    if (!token) return;
    const url = `${window.location.origin}/shared/report/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Share link copied to clipboard" });
  };

  const reportData = (report as any)?.reportData as any;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
            <Link href={`/app/contracts/${id}`} className="hover:text-primary transition-colors">CONTRACT</Link>
            <ChevronRight className="h-3 w-3" />
            <span>PERFORMANCE REPORT</span>
          </div>
          <h1 className="font-editorial text-4xl font-light">Performance Report</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">AI-generated compliance and performance analysis ready to share with your sponsor.</p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          {report && (
            <button 
              className="h-11 px-5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm font-semibold flex items-center transition-colors"
              onClick={handleCopyShareLink}
            >
              <Share2 className="mr-2 h-4 w-4" />Share
            </button>
          )}
          <button 
            className="h-11 px-6 rounded-lg btn-glow bg-primary text-primary-foreground hover:bg-primary/90 font-semibold flex items-center transition-all disabled:opacity-50"
            onClick={handleGenerate} 
            disabled={generating || generateMutation.isPending}
          >
            {(generating || generateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart2 className="mr-2 h-4 w-4" />}
            {report ? "Regenerate" : "Generate Report"}
          </button>
        </div>
      </div>

      {!report && !generating && (
        <div className="glass-card border-dashed border-white/[0.15] p-16 flex flex-col items-center justify-center gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-xl mb-2">No report yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Generate an AI-powered compliance report based on your contract requirements and milestone data.</p>
          </div>
          <Button 
            className="mt-2 btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 rounded-lg font-semibold"
            onClick={handleGenerate}
          >
            Generate Report
          </Button>
        </div>
      )}

      {(generating || generateMutation.isPending) && !report && (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-6 text-center shadow-[0_0_50px_-12px_rgba(255,184,0,0.15)] border-primary/20">
          <div className="w-24 h-24 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center relative">
            <FlowraLogo className="w-10 h-10 animate-float" />
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          </div>
          <div>
            <p className="text-label text-primary mb-2 animate-pulse">CLAUDE AI IS WORKING</p>
            <h3 className="font-editorial text-2xl font-light mb-2">Generating performance report…</h3>
            <p className="text-sm text-muted-foreground">Analyzing milestones and compliance data.</p>
          </div>
        </div>
      )}

      {report && reportData && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Score */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card md:col-span-1 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className={`text-7xl font-mono font-light tracking-tighter mb-4 ${(report as any).complianceScore >= 80 ? "text-accent" : (report as any).complianceScore >= 50 ? "text-primary" : "text-destructive"}`}>
                {(report as any).complianceScore ?? reportData?.overall_compliance_score ?? 0}<span className="text-4xl text-muted-foreground">%</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">COMPLIANCE SCORE</p>
              <p className="text-sm font-medium text-foreground truncate w-full">{(report as any).campaignName || "Campaign"}</p>
            </div>
            
            <div className="glass-card md:col-span-2 p-6 flex flex-col">
              <h3 className="text-label mb-4">EXECUTIVE SUMMARY</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{reportData?.executive_summary || "No summary available."}</p>
            </div>
          </div>

          {/* Campaign Overview */}
          {reportData?.campaign_overview && (
            <div className="glass-card p-6">
              <h3 className="text-label mb-5">CAMPAIGN OVERVIEW</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Object.entries(reportData.campaign_overview).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs font-mono text-muted-foreground mb-1">{key.replace(/_/g, " ").toUpperCase()}</p>
                    <p className="font-semibold text-sm">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliverable Results */}
          {Array.isArray(reportData?.deliverable_results) && reportData.deliverable_results.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-label mb-5">DELIVERABLE COMPLIANCE</h3>
              <div className="space-y-4">
                {reportData.deliverable_results.map((d: any, i: number) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-base mb-2">{d.title}</p>
                        {d.platform && <span className="text-xs font-mono px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08]">{d.platform}</span>}
                      </div>
                      <span className={`text-xs font-mono px-2.5 py-1 rounded flex items-center gap-1.5 w-fit shrink-0 border ${
                        d.status === "compliant" ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}>
                        {d.status === "compliant" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {d.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {d.content_url && (
                        <a href={d.content_url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary flex items-center gap-1.5 hover:underline w-fit bg-primary/5 px-2 py-1 rounded border border-primary/10">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{d.content_url}</span>
                        </a>
                      )}
                      {Array.isArray(d.hashtags_missing) && d.hashtags_missing.length > 0 && (
                        <div className="text-xs font-mono text-destructive flex items-center gap-1.5 bg-destructive/10 px-2.5 py-1.5 rounded border border-destructive/20">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>MISSING HASHTAGS: {d.hashtags_missing.join(", ")}</span>
                        </div>
                      )}
                      {d.notes && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{d.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {(reportData?.recommendations || reportData?.next_steps) && (
            <div className="grid md:grid-cols-2 gap-6">
              {reportData.recommendations && (
                <div className="glass-card p-6">
                  <h3 className="text-label mb-4 text-primary">RECOMMENDATIONS</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{reportData.recommendations}</p>
                </div>
              )}
              {reportData.next_steps && (
                <div className="glass-card p-6">
                  <h3 className="text-label mb-4">NEXT STEPS</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{reportData.next_steps}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

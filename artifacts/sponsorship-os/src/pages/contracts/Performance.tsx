import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGeneratePerformanceReport, useGetPerformanceReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart2, CheckCircle2, XCircle, AlertCircle, ExternalLink, Share2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href={`/app/contracts/${id}`} className="hover:text-foreground">Contract</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Performance Report</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Report</h1>
          <p className="text-muted-foreground mt-1">AI-generated compliance and performance analysis ready to share with your sponsor.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {report && (
            <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
              <Share2 className="mr-2 h-4 w-4" />Share
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={generating || generateMutation.isPending}>
            {(generating || generateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart2 className="mr-2 h-4 w-4" />}
            {report ? "Regenerate" : "Generate Report"}
          </Button>
        </div>
      </div>

      {!report && !generating && (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <BarChart2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No report yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Generate an AI-powered compliance report based on your contract requirements and milestone data.</p>
            </div>
            <Button onClick={handleGenerate}>Generate Report</Button>
          </CardContent>
        </Card>
      )}

      {(generating || generateMutation.isPending) && !report && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Generating performance report…</p>
              <p className="text-sm text-muted-foreground">Claude AI is analyzing your milestones and compliance data.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {report && reportData && (
        <div className="space-y-6">
          {/* Score */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className={`text-6xl font-black mb-2 ${(report as any).complianceScore >= 80 ? "text-green-400" : (report as any).complianceScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {(report as any).complianceScore ?? reportData?.overall_compliance_score ?? 0}%
                </div>
                <p className="text-sm font-medium">Compliance Score</p>
                <p className="text-xs text-muted-foreground mt-1">{(report as any).campaignName || "Campaign"}</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-sm">Executive Summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{reportData?.executive_summary || "No summary available."}</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Overview */}
          {reportData?.campaign_overview && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Campaign Overview</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(reportData.campaign_overview).map(([key, val]) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground">{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</dt>
                      <dd className="font-medium mt-0.5">{String(val)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Deliverable Results */}
          {Array.isArray(reportData?.deliverable_results) && reportData.deliverable_results.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Deliverable Compliance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {reportData.deliverable_results.map((d: any, i: number) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{d.title}</p>
                        {d.platform && <Badge variant="outline" className="text-xs mt-1">{d.platform}</Badge>}
                      </div>
                      <Badge variant="outline" className={d.status === "compliant" ? "text-green-400 border-green-500/30" : "text-red-400 border-red-500/30"}>
                        {d.status === "compliant" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {d.status}
                      </Badge>
                    </div>
                    {d.content_url && (
                      <a href={d.content_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                        <ExternalLink className="h-3 w-3" />{d.content_url}
                      </a>
                    )}
                    {Array.isArray(d.hashtags_missing) && d.hashtags_missing.length > 0 && (
                      <div className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />Missing hashtags: {d.hashtags_missing.join(", ")}
                      </div>
                    )}
                    {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {(reportData?.recommendations || reportData?.next_steps) && (
            <div className="grid md:grid-cols-2 gap-4">
              {reportData.recommendations && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{reportData.recommendations}</p></CardContent>
                </Card>
              )}
              {reportData.next_steps && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Next Steps</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{reportData.next_steps}</p></CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

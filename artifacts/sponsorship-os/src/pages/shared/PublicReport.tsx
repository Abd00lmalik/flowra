import { useParams } from "wouter";
import { useGetPublicReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const { data: report, isLoading, isError } = useGetPublicReport(token!, { query: { enabled: !!token } as any });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Report Not Found</h1>
          <p className="text-muted-foreground">This report link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const r = report as any;
  const reportData = r.reportData as any;
  const score = r.complianceScore ?? reportData?.overall_compliance_score ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary">Flowra</span>
            <Badge variant="outline">Shared Report</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(r.generatedAt || r.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Title + score */}
        <div className="text-center space-y-3 py-8">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{r.brandName || "Brand"} × {r.campaignName || "Campaign"}</p>
          <h1 className="text-4xl font-black">Performance Report</h1>
          <div className={`text-7xl font-black ${score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
            {score}%
          </div>
          <p className="text-lg text-muted-foreground">Compliance Score</p>
        </div>

        {/* Executive Summary */}
        {reportData?.executive_summary && (
          <Card>
            <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
            <CardContent><p className="leading-relaxed text-muted-foreground">{reportData.executive_summary}</p></CardContent>
          </Card>
        )}

        {/* Campaign Overview */}
        {reportData?.campaign_overview && (
          <Card>
            <CardHeader><CardTitle>Campaign Overview</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(reportData.campaign_overview).map(([key, val]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</dt>
                    <dd className="font-semibold mt-0.5">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Deliverable Results */}
        {Array.isArray(reportData?.deliverable_results) && reportData.deliverable_results.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Deliverable Compliance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {reportData.deliverable_results.map((d: any, i: number) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{d.title}</p>
                      {d.platform && <Badge variant="outline" className="text-xs mt-1">{d.platform}</Badge>}
                    </div>
                    {d.status && (
                      <Badge variant="outline" className={d.status === "compliant" ? "text-green-400 border-green-500/30" : "text-red-400 border-red-500/30"}>
                        {d.status === "compliant" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {d.status}
                      </Badge>
                    )}
                  </div>
                  {d.content_url && (
                    <a href={d.content_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline">
                      <ExternalLink className="h-3 w-3" />{d.content_url}
                    </a>
                  )}
                  {Array.isArray(d.hashtags_missing) && d.hashtags_missing.length > 0 && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />Missing hashtags: {d.hashtags_missing.join(", ")}
                    </p>
                  )}
                  {Array.isArray(d.hashtags_found) && d.hashtags_found.length > 0 && (
                    <p className="text-xs text-green-400 mt-1">✓ Found: {d.hashtags_found.join(", ")}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {reportData?.recommendations && (
          <Card>
            <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground leading-relaxed">{reportData.recommendations}</p></CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          Generated by <span className="text-primary font-semibold">Flowra</span> · Workflow automation for creator deals
        </p>
      </div>
    </div>
  );
}

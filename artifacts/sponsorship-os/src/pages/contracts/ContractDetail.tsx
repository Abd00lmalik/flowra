import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useGetContract, useReprocessContract, useDeleteContract, useExportContractToNotion } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, RefreshCw, Trash2, ExternalLink, Copy, ChevronRight, BarChart2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notionDb, setNotionDb] = useState("");
  const [showNotionInput, setShowNotionInput] = useState(false);

  const { data, isLoading, refetch } = useGetContract(id!, { query: { enabled: !!id } as any });
  const reprocessMutation = useReprocessContract();
  const deleteMutation = useDeleteContract();
  const exportMutation = useExportContractToNotion();

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return <div className="text-center py-12">Contract not found.</div>;

  const contract = (data as any).contract;
  const extraction = (data as any).extraction;

  const riskFlags: any[] = Array.isArray(extraction?.riskFlags) ? extraction.riskFlags : [];
  const deliverables: any[] = Array.isArray(extraction?.deliverables) ? extraction.deliverables : [];
  const paymentSchedule: any[] = Array.isArray(extraction?.paymentSchedule) ? extraction.paymentSchedule : [];
  const platforms: string[] = Array.isArray(extraction?.platforms) ? extraction.platforms : [];
  const hashtags: string[] = Array.isArray(extraction?.requiredHashtags) ? extraction.requiredHashtags : [];
  const mentions: string[] = Array.isArray(extraction?.requiredMentions) ? extraction.requiredMentions : [];

  const handleDelete = () => {
    if (!confirm("Delete this contract and all related milestones? This cannot be undone.")) return;
    deleteMutation.mutate({ id: id! }, {
      onSuccess: () => setLocation("/app/contracts"),
    });
  };

  const handleReprocess = () => {
    reprocessMutation.mutate({ id: id! }, {
      onSuccess: () => {
        toast({ title: "Reprocessing started", description: "AI is re-analyzing the contract." });
        refetch();
      },
    });
  };

  const handleNotionExport = () => {
    if (!notionDb) { toast({ title: "Enter a Notion Database ID", variant: "destructive" }); return; }
    exportMutation.mutate(
      { contractId: id!, data: { databaseId: notionDb } },
      {
        onSuccess: (res: any) => {
          toast({ title: "Exported to Notion", description: "Page created successfully." });
          if (res?.notionUrl) window.open(res.notionUrl, "_blank");
          setShowNotionInput(false);
        },
        onError: () => toast({ title: "Export failed", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/app/contracts" className="hover:text-foreground">Contracts</Link>
            <ChevronRight className="h-3 w-3" />
            <span>{contract.title}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{contract.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={contract.status === "active" ? "default" : "secondary"}>{contract.status}</Badge>
            {extraction && (
              <Badge variant="outline" className="text-xs">{extraction.brandName || "Unknown Brand"}</Badge>
            )}
            {contract.aiProcessingStatus === "processing" && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />Processing
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/app/contracts/${id}/milestones`}>
            <Button variant="outline" size="sm">Milestones</Button>
          </Link>
          <Link href={`/app/contracts/${id}/performance`}>
            <Button variant="outline" size="sm"><BarChart2 className="h-4 w-4 mr-1" />Report</Button>
          </Link>
          <Link href={`/app/contracts/${id}/sentiment`}>
            <Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 mr-1" />Sentiment</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleReprocess} disabled={reprocessMutation.isPending}>
            <RefreshCw className={`h-4 w-4 ${reprocessMutation.isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!extraction && contract.aiProcessingStatus !== "processing" && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium text-sm">AI extraction not complete</p>
              <p className="text-xs text-muted-foreground">
                {contract.aiProcessingStatus === "failed" ? `Error: ${contract.aiError}` : "Contract is pending analysis."}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleReprocess} className="ml-auto shrink-0">Retry Analysis</Button>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {extraction && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Value", value: extraction.totalPayment ? `${extraction.currency || "USD"} ${Number(extraction.totalPayment).toLocaleString()}` : "—" },
            { label: "Brand", value: extraction.brandName || "—" },
            { label: "Campaign", value: extraction.campaignName || "—" },
            { label: "Risk Flags", value: `${riskFlags.length} flag${riskFlags.length !== 1 ? "s" : ""}`, danger: riskFlags.some(f => f.severity === "high") },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`font-bold mt-1 text-sm ${item.danger ? "text-red-400" : ""}`}>{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="risks">Risk Flags {riskFlags.length > 0 && <span className="ml-1 text-red-400">({riskFlags.length})</span>}</TabsTrigger>
          <TabsTrigger value="legal">Legal Terms</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          {extraction ? (
            <>
              {extraction.aiSummary && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">AI Summary</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{extraction.aiSummary}</p>
                  </CardContent>
                </Card>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {platforms.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Platforms</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {platforms.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
                    </CardContent>
                  </Card>
                )}
                {hashtags.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Required Hashtags</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {hashtags.map(h => (
                        <Badge key={h} variant="secondary" className="font-mono text-xs cursor-pointer" onClick={() => { navigator.clipboard.writeText(h); toast({ title: "Copied!" }); }}>
                          {h} <Copy className="h-3 w-3 ml-1 inline" />
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {mentions.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Required Mentions</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {mentions.map(m => <Badge key={m} variant="secondary">{m}</Badge>)}
                    </CardContent>
                  </Card>
                )}
                {extraction.approvalRequirements && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Approval Requirements</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{extraction.approvalRequirements}</p></CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No extraction data yet.</div>
          )}
        </TabsContent>

        <TabsContent value="deliverables" className="mt-4">
          {deliverables.length > 0 ? (
            <div className="space-y-3">
              {deliverables.map((d: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold">{d.title}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {d.platform && <Badge variant="outline">{d.platform}</Badge>}
                          {d.type && <Badge variant="secondary">{d.type}</Badge>}
                          {d.quantity > 1 && <span className="text-muted-foreground">×{d.quantity}</span>}
                          {d.requires_approval && <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">Requires Approval</Badge>}
                        </div>
                        {d.due_date && <p className="text-xs text-muted-foreground">Due: {new Date(d.due_date).toLocaleDateString()}</p>}
                        {d.format_requirements && <p className="text-xs text-muted-foreground mt-1">{d.format_requirements}</p>}
                      </div>
                      {d.payment_amount && (
                        <div className="text-right shrink-0">
                          <p className="font-bold">${Number(d.payment_amount).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No deliverables extracted.</div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          {paymentSchedule.length > 0 ? (
            <div className="space-y-3">
              {paymentSchedule.map((p: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.milestone}</p>
                      <p className="text-sm text-muted-foreground">{p.due_trigger}</p>
                    </div>
                    <p className="font-bold text-lg">${Number(p.amount).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No payment schedule extracted.</div>
          )}
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          {riskFlags.length > 0 ? (
            <div className="space-y-3">
              {riskFlags.map((flag: any, i: number) => (
                <div key={i} className={`rounded-xl border p-4 ${SEVERITY_COLOR[flag.severity] || "border-border bg-card"}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{flag.flag}</p>
                        <Badge variant="outline" className={`text-xs border-current ${SEVERITY_COLOR[flag.severity]}`}>{flag.severity}</Badge>
                      </div>
                      {flag.clause && <p className="text-xs opacity-80 italic">"{flag.clause}"</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-green-500">
              <div className="text-4xl mb-2">✓</div>
              <p className="font-medium">No risk flags detected</p>
              <p className="text-sm text-muted-foreground mt-1">The AI found no concerning clauses.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="legal" className="mt-4 space-y-4">
          {extraction ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Usage Rights", value: extraction.usageRights },
                { label: "Exclusivity", value: extraction.exclusivityClauses },
                { label: "Revision Terms", value: extraction.revisionTerms },
                { label: "Late Payment", value: extraction.latePaymentTerms },
                { label: "Cancellation", value: extraction.cancellationTerms },
              ].filter(item => item.value).map(item => (
                <Card key={item.label}>
                  <CardHeader><CardTitle className="text-sm">{item.label}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{item.value}</p></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No legal terms extracted.</div>
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Export to Notion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Export contract summary, risk flags, and deliverables to a Notion database page.</p>
              {showNotionInput ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Notion Database ID"
                    value={notionDb}
                    onChange={e => setNotionDb(e.target.value)}
                  />
                  <Button onClick={handleNotionExport} disabled={exportMutation.isPending} size="sm">
                    {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Export
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowNotionInput(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowNotionInput(true)}>
                  <ExternalLink className="mr-2 h-4 w-4" />Export to Notion
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Requires <code className="text-primary">NOTION_API_KEY</code> set in settings.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

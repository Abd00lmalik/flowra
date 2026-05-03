import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useGetContract, useReprocessContract, useDeleteContract, useExportContractToNotion } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, RefreshCw, Trash2, ExternalLink, Copy, ChevronRight, BarChart2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowraLogo } from "@/components/FlowraLogo";

const SEVERITY_COLOR: Record<string, string> = {
  high: "text-destructive bg-destructive/10 border-destructive/20",
  medium: "text-primary bg-primary/10 border-primary/20",
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
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 font-mono text-muted-foreground">Contract not found.</div>;

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
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
            <Link href="/app/contracts" className="hover:text-primary transition-colors">CONTRACTS</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{contract.title.toUpperCase()}</span>
          </div>
          <h1 className="font-editorial text-4xl font-light mb-4">{contract.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-mono px-2.5 py-1 rounded border ${
              contract.status === "active" ? "bg-accent/10 text-accent border-accent/20" : "bg-white/[0.04] text-muted-foreground border-white/[0.08]"
            }`}>
              {contract.status.toUpperCase()}
            </span>
            {extraction && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-foreground">
                {extraction.brandName?.toUpperCase() || "UNKNOWN BRAND"}
              </span>
            )}
            {contract.aiProcessingStatus === "processing" && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />PROCESSING
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href={`/app/contracts/${id}/milestones`} className="h-10 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] flex items-center text-sm transition-colors">
            Milestones
          </Link>
          <Link href={`/app/contracts/${id}/performance`} className="h-10 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] flex items-center text-sm transition-colors">
            <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />Report
          </Link>
          <Link href={`/app/contracts/${id}/sentiment`} className="h-10 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] flex items-center text-sm transition-colors">
            <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />Sentiment
          </Link>
          <button onClick={handleReprocess} disabled={reprocessMutation.isPending} className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors">
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${reprocessMutation.isPending ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleDelete} className="h-10 w-10 flex items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors">
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      </div>

      {!extraction && contract.aiProcessingStatus !== "processing" && (
        <div className="glass-card border-primary/30 p-5 flex items-center gap-4 animate-fade-in-up">
          <AlertTriangle className="h-6 w-6 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm">AI extraction not complete</p>
            <p className="text-xs text-muted-foreground mt-1">
              {contract.aiProcessingStatus === "failed" ? `Error: ${contract.aiError}` : "Contract is pending analysis."}
            </p>
          </div>
          <button onClick={handleReprocess} className="ml-auto shrink-0 h-9 px-4 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-mono font-semibold transition-colors">
            RETRY ANALYSIS
          </button>
        </div>
      )}

      {/* Summary cards */}
      {extraction && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "TOTAL VALUE", value: extraction.totalPayment ? `${extraction.currency || "USD"} ${Number(extraction.totalPayment).toLocaleString()}` : "—", bold: true },
            { label: "BRAND", value: extraction.brandName || "—" },
            { label: "CAMPAIGN", value: extraction.campaignName || "—" },
            { label: "RISK FLAGS", value: `${riskFlags.length} FLAG${riskFlags.length !== 1 ? "S" : ""}`, danger: riskFlags.some(f => f.severity === "high") },
          ].map(item => (
            <div key={item.label} className="glass-card p-5">
              <p className="text-xs font-mono text-muted-foreground mb-2">{item.label}</p>
              <p className={`text-lg font-mono truncate ${item.danger ? "text-destructive" : item.bold ? "font-bold text-accent" : "text-foreground"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="bg-transparent border-b border-white/[0.1] rounded-none w-full justify-start h-auto p-0 space-x-6">
          {["summary", "deliverables", "payments", "risks", "legal", "export"].map(tab => (
            <TabsTrigger 
              key={tab} 
              value={tab}
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-sm font-mono uppercase data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all"
            >
              {tab}
              {tab === "risks" && riskFlags.length > 0 && <span className="ml-2 text-destructive">({riskFlags.length})</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="summary" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            {extraction ? (
              <>
                {extraction.aiSummary && (
                  <div className="glass-card p-6">
                    <h3 className="text-label mb-3">AI SUMMARY</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{extraction.aiSummary}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-6">
                  {platforms.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="text-label mb-4">PLATFORMS</h3>
                      <div className="flex flex-wrap gap-2">
                        {platforms.map(p => (
                          <span key={p} className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-sm text-foreground">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hashtags.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="text-label mb-4">REQUIRED HASHTAGS</h3>
                      <div className="flex flex-wrap gap-2">
                        {hashtags.map(h => (
                          <span key={h} className="px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-sm font-mono cursor-pointer hover:bg-primary/20 transition-colors flex items-center group" onClick={() => { navigator.clipboard.writeText(h); toast({ title: "Copied!" }); }}>
                            {h} <Copy className="h-3 w-3 ml-2 opacity-50 group-hover:opacity-100" />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {mentions.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="text-label mb-4">REQUIRED MENTIONS</h3>
                      <div className="flex flex-wrap gap-2">
                        {mentions.map(m => (
                          <span key={m} className="px-3 py-1 rounded bg-accent/10 border border-accent/20 text-accent text-sm font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {extraction.approvalRequirements && (
                    <div className="glass-card p-6">
                      <h3 className="text-label mb-3">APPROVAL REQUIREMENTS</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{extraction.approvalRequirements}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 font-mono text-muted-foreground opacity-50">NO EXTRACTION DATA YET</div>
            )}
          </TabsContent>

          <TabsContent value="deliverables" className="focus-visible:outline-none focus-visible:ring-0">
            {deliverables.length > 0 ? (
              <div className="grid gap-4">
                {deliverables.map((d: any, i: number) => (
                  <div key={i} className="glass-card p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <p className="font-semibold text-lg">{d.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {d.platform && <span className="text-xs font-mono px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08]">{d.platform}</span>}
                          {d.type && <span className="text-xs font-mono px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08]">{d.type}</span>}
                          {d.quantity > 1 && <span className="text-xs font-mono px-2 py-1 text-muted-foreground">×{d.quantity}</span>}
                          {d.requires_approval && <span className="text-xs font-mono px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary">REQUIRES APPROVAL</span>}
                        </div>
                        {d.due_date && <p className="text-xs font-mono text-muted-foreground">DUE: {new Date(d.due_date).toLocaleDateString()}</p>}
                        {d.format_requirements && <p className="text-sm text-muted-foreground mt-2">{d.format_requirements}</p>}
                      </div>
                      {d.payment_amount && (
                        <div className="md:text-right shrink-0">
                          <p className="font-mono text-xl text-accent">${Number(d.payment_amount).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 font-mono text-muted-foreground opacity-50">NO DELIVERABLES EXTRACTED</div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="focus-visible:outline-none focus-visible:ring-0">
            {paymentSchedule.length > 0 ? (
              <div className="space-y-4">
                {paymentSchedule.map((p: any, i: number) => (
                  <div key={i} className="glass-card p-5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">{p.milestone}</p>
                      <p className="text-sm text-muted-foreground mt-1">{p.due_trigger}</p>
                    </div>
                    <p className="font-mono text-2xl text-accent font-light">${Number(p.amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 font-mono text-muted-foreground opacity-50">NO PAYMENT SCHEDULE EXTRACTED</div>
            )}
          </TabsContent>

          <TabsContent value="risks" className="focus-visible:outline-none focus-visible:ring-0">
            {riskFlags.length > 0 ? (
              <div className="grid gap-4">
                {riskFlags.map((flag: any, i: number) => (
                  <div key={i} className={`rounded-xl border p-5 ${SEVERITY_COLOR[flag.severity] || "border-border bg-card"}`}>
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className="font-semibold text-base">{flag.flag}</p>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded border-current border shrink-0 uppercase w-fit ${SEVERITY_COLOR[flag.severity]}`}>{flag.severity}</span>
                        </div>
                        {flag.clause && (
                          <div className="bg-black/20 p-3 rounded-lg border border-black/10">
                            <p className="text-sm italic opacity-80 leading-relaxed">"{flag.clause}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
                <div className="text-5xl mb-4 text-green-400">✓</div>
                <p className="font-semibold text-lg text-foreground">No risk flags detected</p>
                <p className="text-sm text-muted-foreground mt-2">The AI found no concerning clauses.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="legal" className="focus-visible:outline-none focus-visible:ring-0">
            {extraction ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { label: "USAGE RIGHTS", value: extraction.usageRights },
                  { label: "EXCLUSIVITY", value: extraction.exclusivityClauses },
                  { label: "REVISION TERMS", value: extraction.revisionTerms },
                  { label: "LATE PAYMENT", value: extraction.latePaymentTerms },
                  { label: "CANCELLATION", value: extraction.cancellationTerms },
                ].filter(item => item.value).map(item => (
                  <div key={item.label} className="glass-card p-6">
                    <h3 className="text-label mb-3">{item.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 font-mono text-muted-foreground opacity-50">NO LEGAL TERMS EXTRACTED</div>
            )}
          </TabsContent>

          <TabsContent value="export" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="glass-card p-8 max-w-2xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Export to Notion</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">Sync contract summary, risk flags, and deliverables directly to your Notion database.</p>
              </div>
              
              {showNotionInput ? (
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
                  <input
                    className="flex-1 h-11 rounded-lg border border-white/[0.1] bg-white/[0.02] px-4 text-sm focus:outline-none focus:border-primary/50 font-mono"
                    placeholder="Database ID"
                    value={notionDb}
                    onChange={e => setNotionDb(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleNotionExport} 
                      disabled={exportMutation.isPending}
                      className="h-11 px-5 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary/90 flex items-center disabled:opacity-50 transition-colors"
                    >
                      {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Export"}
                    </button>
                    <button 
                      onClick={() => setShowNotionInput(false)}
                      className="h-11 px-4 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowNotionInput(true)}
                  className="h-12 px-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] font-semibold flex items-center mx-auto transition-colors"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Start Export
                </button>
              )}
              <p className="text-xs text-muted-foreground font-mono mt-4">REQUIRES NOTION_API_KEY CONFIGURED</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

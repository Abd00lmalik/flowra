import { useListContracts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FileText, ChevronRight, Upload } from "lucide-react";
import { FlowraLogo } from "@/components/FlowraLogo";

const statusStyles: Record<string, string> = {
  active: "bg-accent/10 text-accent border-accent/20",
  completed: "bg-white/[0.06] text-muted-foreground border-white/[0.1]",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  paused: "bg-primary/10 text-primary border-primary/20",
};

const aiStatusStyles: Record<string, { label: string; class: string }> = {
  pending: { label: "QUEUED", class: "text-muted-foreground" },
  processing: { label: "EXTRACTING", class: "text-primary animate-pulse" },
  complete: { label: "AI COMPLETE", class: "text-accent" },
  failed: { label: "FAILED", class: "text-destructive" },
};

export default function ContractList() {
  const { data: contracts, isLoading } = useListContracts();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const list = (contracts as any[]) ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-label mb-2">CONTRACT INTELLIGENCE</p>
          <h1 className="font-editorial text-4xl font-light">Contracts</h1>
        </div>
        <Link href="/app/contracts/new">
          <Button className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 text-sm font-semibold rounded-lg">
            <Upload className="mr-2 h-4 w-4" /> Upload Contract
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText className="h-14 w-14 mx-auto mb-6 text-muted-foreground opacity-20" />
          <h3 className="font-editorial text-2xl font-light mb-2">No contracts yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Upload a sponsorship contract PDF to get started.</p>
          <Link href="/app/contracts/new">
            <Button className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 text-sm font-semibold rounded-lg">
              <Upload className="mr-2 h-4 w-4" /> Upload your first contract
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item: any) => {
            const c = item.contract ?? item;
            const ext = item.extraction;
            const aiStatus = aiStatusStyles[c.aiProcessingStatus] || aiStatusStyles.pending;
            return (
              <Link key={c.id} href={`/app/contracts/${c.id}`}>
                <div className="glass-card p-5 flex items-center gap-5 cursor-pointer group transition-all duration-500 hover:border-primary/30">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-500">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm">{c.title}</h3>
                      {ext?.brandName && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
                          {ext.brandName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      {ext?.totalPayment && (
                        <span>${Number(ext.totalPayment).toLocaleString()} {ext.currency || "USD"}</span>
                      )}
                      {item.milestonesCount !== undefined && (
                        <span>{item.milestonesCount} MILESTONE{item.milestonesCount !== 1 ? "S" : ""}</span>
                      )}
                      <span className={aiStatus.class}>{aiStatus.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${statusStyles[c.status] || statusStyles.active}`}>
                      {c.status.toUpperCase()}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all duration-500" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

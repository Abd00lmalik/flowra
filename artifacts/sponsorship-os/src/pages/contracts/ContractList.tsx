import { useListContracts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FileText, ChevronRight } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
  paused: "outline",
};

export default function ContractList() {
  const { data: contracts, isLoading } = useListContracts();

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const list = (contracts as any[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
        <Link href="/app/contracts/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Contract</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl border-border">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-medium">No contracts yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">Upload a sponsorship contract PDF to get started.</p>
          <Link href="/app/contracts/new">
            <Button className="mt-4"><Plus className="mr-2 h-4 w-4" />Upload Contract</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item: any) => {
            const c = item.contract ?? item;
            const ext = item.extraction;
            return (
              <Link key={c.id} href={`/app/contracts/${c.id}`}>
                <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{c.title}</h3>
                        {ext?.brandName && (
                          <Badge variant="outline" className="text-xs">{ext.brandName}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">{c.originalFilename}</p>
                        {ext?.totalPayment && (
                          <span className="text-xs text-muted-foreground">·  ${Number(ext.totalPayment).toLocaleString()} {ext.currency || "USD"}</span>
                        )}
                        {item.milestonesCount !== undefined && (
                          <span className="text-xs text-muted-foreground">· {item.milestonesCount} milestone{item.milestonesCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {c.aiProcessingStatus === "processing" && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />Processing
                        </Badge>
                      )}
                      <Badge variant={(STATUS_COLOR[c.status] || "secondary") as any}>{c.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

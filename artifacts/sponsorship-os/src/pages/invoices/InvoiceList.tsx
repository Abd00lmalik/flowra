import { useState } from "react";
import { Link } from "wouter";
import { useListInvoices, useUpdateInvoice } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ExternalLink, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
  paid: { label: "Paid", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
};

export default function InvoiceList() {
  const { data: invoices, isLoading } = useListInvoices({});
  const updateMutation = useUpdateInvoice();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const list = (invoices as any[] | undefined) || [];
  const filtered = filter === "all" ? list : list.filter((i: any) => i.status === filter);

  const totalPaid = list.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + Number(i.netAmount || i.amount || 0), 0);
  const totalPending = list.filter((i: any) => i.status === "sent").reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

  const markPaid = (id: string) => {
    updateMutation.mutate({ id, data: { status: "paid" } }, {
      onSuccess: () => toast({ title: "Invoice marked as paid" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <Link href="/app/invoices/new">
          <Button><Plus className="mr-2 h-4 w-4" />New Invoice</Button>
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Paid", value: `$${totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "text-green-400" },
          { label: "Pending", value: `$${totalPending.toLocaleString()}`, icon: Clock, color: "text-blue-400" },
          { label: "Total Invoices", value: String(list.length), icon: DollarSign, color: "text-primary" },
          { label: "Overdue", value: String(list.filter((i: any) => i.status === "sent" && i.dueDate && new Date(i.dueDate) < new Date()).length), icon: XCircle, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "sent", "paid", "failed", "cancelled"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first invoice to get paid.</p>
          <Link href="/app/invoices/new">
            <Button className="mt-4" size="sm"><Plus className="mr-2 h-4 w-4" />Create Invoice</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice: any) => {
            const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
            const isOverdue = invoice.status === "sent" && invoice.dueDate && new Date(invoice.dueDate) < new Date();
            return (
              <Card key={invoice.id} className={`transition-colors ${isOverdue ? "border-red-500/30" : ""}`}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{invoice.brandName}</p>
                      <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                        <cfg.icon className="h-3 w-3 mr-1" />
                        {isOverdue ? "Overdue" : cfg.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {invoice.contractTitle || "No contract"} · {invoice.brandEmail}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}
                      {invoice.paidAt && ` · Paid: ${new Date(invoice.paidAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xl font-bold">${Number(invoice.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{invoice.currency}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {invoice.stripeInvoiceUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />View
                        </a>
                      </Button>
                    )}
                    {invoice.status === "sent" && (
                      <Button variant="outline" size="sm" onClick={() => markPaid(invoice.id)} disabled={updateMutation.isPending}>
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

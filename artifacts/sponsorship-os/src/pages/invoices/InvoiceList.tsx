import { useState } from "react";
import { Link } from "wouter";
import { useListInvoices, useUpdateInvoice } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ExternalLink, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowraLogo } from "@/components/FlowraLogo";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft: { label: "DRAFT", class: "bg-white/[0.04] text-muted-foreground border-white/[0.08]" },
  sent: { label: "SENT", class: "bg-primary/10 text-primary border-primary/20" },
  paid: { label: "PAID", class: "bg-accent/10 text-accent border-accent/20" },
  failed: { label: "FAILED", class: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "CANCELLED", class: "bg-white/[0.04] text-muted-foreground border-white/[0.08]" },
};

export default function InvoiceList() {
  const { data: invoices, isLoading } = useListInvoices({});
  const updateMutation = useUpdateInvoice();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-label mb-2">PAYSTACK INVOICING</p>
          <h1 className="font-editorial text-4xl font-light">Invoices</h1>
        </div>
        <Link href="/app/invoices/new">
          <Button className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 text-sm font-semibold rounded-lg">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "TOTAL PAID", value: `$${totalPaid.toLocaleString()}`, accent: "text-accent" },
          { label: "PENDING", value: `$${totalPending.toLocaleString()}`, accent: "text-primary" },
          { label: "TOTAL INVOICES", value: String(list.length), accent: "text-foreground" },
          { label: "OVERDUE", value: String(list.filter((i: any) => i.status === "sent" && i.dueDate && new Date(i.dueDate) < new Date()).length), accent: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-label mb-2">{s.label}</p>
            <p className={`font-mono text-2xl font-bold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "sent", "paid", "failed", "cancelled"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-500 ${
              filter === s
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-transparent text-muted-foreground border-white/[0.06] hover:border-white/[0.12] hover:text-foreground"
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <DollarSign className="h-14 w-14 mx-auto mb-6 text-muted-foreground opacity-20" />
          <h3 className="font-editorial text-2xl font-light mb-2">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first invoice to start getting paid.</p>
          <Link href="/app/invoices/new">
            <Button className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 text-sm font-semibold rounded-lg">
              <Plus className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-2 text-label">
            <div className="col-span-4">BRAND</div>
            <div className="col-span-2">CONTRACT</div>
            <div className="col-span-2 text-right">AMOUNT</div>
            <div className="col-span-2 text-center">STATUS</div>
            <div className="col-span-2 text-right">ACTIONS</div>
          </div>

          {filtered.map((invoice: any) => {
            const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
            const isOverdue = invoice.status === "sent" && invoice.dueDate && new Date(invoice.dueDate) < new Date();
            return (
              <div
                key={invoice.id}
                className={`glass-card grid grid-cols-12 gap-4 items-center px-5 py-4 transition-all duration-500 ${
                  isOverdue ? "border-destructive/30" : ""
                }`}
              >
                <div className="col-span-4 min-w-0">
                  <p className="font-semibold text-sm truncate">{invoice.brandName}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">{invoice.brandEmail}</p>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{invoice.contractTitle || "—"}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "NO DUE DATE"}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="font-mono text-lg font-bold">${Number(invoice.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-mono">{invoice.currency}</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-md border inline-block ${cfg.class}`}>
                    {isOverdue ? "OVERDUE" : cfg.label}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  {invoice.paystackPaymentUrl && (
                    <a
                      href={invoice.paystackPaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-primary hover:text-primary/80 transition-colors duration-500"
                    >
                      LINK ↗
                    </a>
                  )}
                  {invoice.status === "sent" && (
                    <button
                      onClick={() => markPaid(invoice.id)}
                      disabled={updateMutation.isPending}
                      className="text-xs font-mono text-accent hover:text-accent/80 transition-colors duration-500"
                    >
                      MARK PAID
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateInvoice, useListContracts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, DollarSign, Info } from "lucide-react";
import { FlowraLogo } from "@/components/FlowraLogo";

const schema = z.object({
  contractId: z.string().min(1, "Select a contract"),
  brandName: z.string().min(1, "Brand name is required"),
  brandEmail: z.string().email("Valid email required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export default function InvoiceNew() {
  const [, setLocation] = useLocation();
  const createMutation = useCreateInvoice();
  const { data: contractsData } = useListContracts({});
  const contracts = (contractsData as any[]) || [];
  const [previewAmount, setPreviewAmount] = useState(0);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { contractId: "", brandName: "", brandEmail: "", amount: "", currency: "USD", dueDate: "", notes: "" },
  });

  const taxReserve = previewAmount * 0.30;
  const available = previewAmount - taxReserve;

  const onSubmit = (values: z.infer<typeof schema>) => {
    createMutation.mutate(
      { data: values as any },
      {
        onSuccess: () => setLocation("/app/invoices"),
        onError: (err: any) => form.setError("root", { message: err.message || "Failed to create invoice" }),
      }
    );
  };

  const handleAmountChange = (val: string) => {
    setPreviewAmount(parseFloat(val) || 0);
  };

  const handleContractSelect = (contractId: string) => {
    const found = contracts.find((c: any) => (c.contract?.id || c.id) === contractId);
    if (found) {
      const extraction = found.extraction || found.contract?.extraction;
      const brandName = extraction?.brandName;
      if (brandName && !form.getValues("brandName")) {
        form.setValue("brandName", brandName);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08]"
          onClick={() => setLocation("/app/invoices")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-label mb-1">PAYSTACK INVOICING</p>
          <h1 className="font-editorial text-3xl font-light">New Invoice</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {form.formState.errors.root && (
            <div className="text-sm font-mono text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="glass-card p-6 space-y-5">
            <div>
              <p className="text-label mb-1">CONTRACT & BRAND</p>
            </div>
            
            <FormField control={form.control} name="contractId" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Contract</FormLabel>
                <Select onValueChange={(v) => { field.onChange(v); handleContractSelect(v); }} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 bg-white/[0.03] border-white/[0.08]">
                      <SelectValue placeholder="Select a contract" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contracts.map((c: any) => {
                      const contractData = c.contract || c;
                      return (
                        <SelectItem key={contractData.id} value={contractData.id}>
                          {contractData.title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="brandName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nike" className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="brandEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Brand Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="billing@brand.com" className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div>
              <p className="text-label mb-1">PAYMENT DETAILS</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        className="h-12 pl-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 font-mono text-lg"
                        type="number" step="0.01" placeholder="5000.00" {...field}
                        onChange={(e) => { field.onChange(e); handleAmountChange(e.target.value); }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white/[0.03] border-white/[0.08] font-mono">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["USD", "EUR", "GBP", "CAD", "AUD", "NGN", "GHS", "ZAR", "KES"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Due Date (optional)</FormLabel>
                <FormControl>
                  <Input type="date" className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 font-mono" {...field} />
                </FormControl>
                <FormDescription className="text-xs font-mono">LEAVE BLANK FOR DEFAULT TERMS</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Invoice notes or description..."
                    className="min-h-[100px] bg-white/[0.03] border-white/[0.08] focus:border-primary/50 font-mono resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {previewAmount > 0 && (
            <div className="glass-card border-primary/20 bg-primary/5 p-5 animate-fade-in-up">
              <div className="flex items-center gap-2 text-sm font-medium mb-4 text-primary">
                <Info className="h-4 w-4" />
                FINANCIAL BREAKDOWN
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">INVOICE AMOUNT</span>
                  <span>${previewAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-yellow-500/80">
                  <span>TAX RESERVE (30%)</span>
                  <span>-${taxReserve.toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/[0.08] w-full my-2" />
                <div className="flex justify-between text-base">
                  <span className="text-foreground">AVAILABLE TO SPEND</span>
                  <span className="font-bold text-accent">${available.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 px-8 rounded-lg border-white/[0.1] hover:bg-white/[0.05]"
              onClick={() => setLocation("/app/invoices")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-lg font-semibold text-base"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Create & Send Invoice
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

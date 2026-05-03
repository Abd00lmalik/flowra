import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateInvoice, useListContracts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, DollarSign, Info } from "lucide-react";

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/app/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Send a Paystack-powered invoice to your brand partner.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {form.formState.errors.root && (
            <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg">{form.formState.errors.root.message}</div>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Contract & Brand</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="contractId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); handleContractSelect(v); }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a contract" /></SelectTrigger></FormControl>
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
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl><Input placeholder="Nike" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="brandEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Email</FormLabel>
                    <FormControl><Input type="email" placeholder="billing@brand.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Payment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-8" type="number" step="0.01" placeholder="5000.00" {...field}
                          onChange={(e) => { field.onChange(e); handleAmountChange(e.target.value); }} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                  <FormLabel>Due Date (optional)</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormDescription>If blank, uses your default payment terms (30 days).</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl><Textarea placeholder="Invoice notes or description..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {previewAmount > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Info className="h-4 w-4 text-primary" />
                  Financial Breakdown
                </div>
                {[
                  { label: "Invoice Amount", value: `$${previewAmount.toFixed(2)}` },
                  { label: "Tax Reserve (30%)", value: `-$${taxReserve.toFixed(2)}`, muted: true },
                  { label: "Available to Spend", value: `$${available.toFixed(2)}`, bold: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className={row.muted ? "text-muted-foreground" : ""}>{row.label}</span>
                    <span className={row.bold ? "font-bold text-green-400" : row.muted ? "text-muted-foreground" : ""}>{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setLocation("/app/invoices")}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create & Send Invoice
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

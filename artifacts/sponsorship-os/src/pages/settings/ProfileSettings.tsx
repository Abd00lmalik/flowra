import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowraLogo } from "@/components/FlowraLogo";

const schema = z.object({
  businessName: z.string().optional(),
  country: z.string().optional(),
  defaultCurrency: z.string().default("USD"),
  paymentTermsDays: z.coerce.number().min(1).max(365).default(30),
  niche: z.string().optional(),
  taxReservePercent: z.coerce.number().min(0).max(60).default(30),
  averageSponsorshipValue: z.coerce.number().optional(),
});

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NGN", "NZD", "SGD", "CHF"];
const NICHES = ["Tech", "Gaming", "Lifestyle", "Fitness", "Fashion", "Food", "Travel", "Finance", "Education", "Entertainment", "Other"];
const COUNTRIES = ["Nigeria", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Netherlands", "Singapore", "South Africa", "Kenya", "Ghana", "Other"];

export default function ProfileSettings() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useGetProfile();
  const updateMutation = useUpdateProfile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      country: "",
      defaultCurrency: "USD",
      paymentTermsDays: 30,
      niche: "",
      taxReservePercent: 30,
    },
  });

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      form.reset({
        businessName: p.businessName || "",
        country: p.country || "",
        defaultCurrency: p.defaultCurrency || "USD",
        paymentTermsDays: p.paymentTermsDays || 30,
        niche: p.niche || "",
        taxReservePercent: p.taxReservePercent || 30,
        averageSponsorshipValue: p.averageSponsorshipValue ? Number(p.averageSponsorshipValue) : undefined,
      });
    }
  }, [profile]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    updateMutation.mutate(
      { data: values as any },
      {
        onSuccess: () => toast({ title: "Profile updated" }),
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <FlowraLogo className="w-10 h-10 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <p className="text-label mb-2">ACCOUNT</p>
        <h1 className="font-editorial text-4xl font-light">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-2">Manage your creator profile and business preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Information */}
          <div className="glass-card p-6 space-y-5">
            <div>
              <p className="text-label mb-1">BUSINESS INFORMATION</p>
              <p className="text-xs text-muted-foreground">Used on invoices and performance reports.</p>
            </div>
            <FormField control={form.control} name="businessName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Business / Creator Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your Brand Name"
                    className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 rounded-lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Country</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-11 bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="niche" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Content Niche</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-11 bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder="Select niche" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {NICHES.map(n => <SelectItem key={n} value={n.toLowerCase()}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Financial Preferences */}
          <div className="glass-card p-6 space-y-5">
            <div>
              <p className="text-label mb-1">FINANCIAL PREFERENCES</p>
              <p className="text-xs text-muted-foreground">Defaults for invoices and tax reserve calculations.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Default Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-11 bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentTermsDays" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Payment Terms (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number" min={1} max={365}
                      className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 rounded-lg font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs font-mono text-muted-foreground">DEFAULT NET DAYS FOR INVOICES</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="taxReservePercent" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tax Reserve %</FormLabel>
                  <FormControl>
                    <Input
                      type="number" min={0} max={60}
                      className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 rounded-lg font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs font-mono text-muted-foreground">AUTO SET ASIDE FOR TAXES</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="averageSponsorshipValue" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Avg. Deal Value ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number" min={0} placeholder="5000"
                      className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 rounded-lg font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 text-sm font-semibold rounded-lg"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

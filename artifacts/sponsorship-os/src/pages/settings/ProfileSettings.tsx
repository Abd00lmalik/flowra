import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  businessName: z.string().optional(),
  country: z.string().optional(),
  defaultCurrency: z.string().default("USD"),
  paymentTermsDays: z.coerce.number().min(1).max(365).default(30),
  niche: z.string().optional(),
  taxReservePercent: z.coerce.number().min(0).max(60).default(30),
  averageSponsorshipValue: z.coerce.number().optional(),
});

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "SGD", "CHF"];
const NICHES = ["Tech", "Gaming", "Lifestyle", "Fitness", "Fashion", "Food", "Travel", "Finance", "Education", "Entertainment", "Other"];
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Netherlands", "Singapore", "Other"];

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
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your creator profile and business preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Business Information</CardTitle>
              <CardDescription>Used on invoices and performance reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="businessName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business / Creator Name</FormLabel>
                  <FormControl><Input placeholder="Your Brand Name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="niche" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Niche</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select niche" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {NICHES.map(n => <SelectItem key={n} value={n.toLowerCase()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Financial Preferences</CardTitle>
              <CardDescription>Defaults used when creating invoices and calculating tax reserves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="defaultCurrency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="paymentTermsDays" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (days)</FormLabel>
                    <FormControl><Input type="number" min={1} max={365} {...field} /></FormControl>
                    <FormDescription>Default net days for invoices (e.g. 30 = Net-30).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="taxReservePercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Reserve %</FormLabel>
                    <FormControl><Input type="number" min={0} max={60} {...field} /></FormControl>
                    <FormDescription>% of income auto-set aside for taxes.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="averageSponsorshipValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avg. Deal Value ($)</FormLabel>
                    <FormControl><Input type="number" min={0} placeholder="5000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

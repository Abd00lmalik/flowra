import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { Loader2, ArrowRight } from "lucide-react";
import { FlowraFull } from "@/components/FlowraLogo";

const formSchema = z.object({
  businessName: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  niche: z.string().optional(),
  defaultCurrency: z.string().optional(),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const completeMutation = useCompleteOnboarding();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { businessName: "", country: "", niche: "", defaultCurrency: "USD" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    completeMutation.mutate({
      data: {
        name: values.businessName,
        businessName: values.businessName,
        country: values.country,
        defaultCurrency: values.defaultCurrency || "USD",
        taxReservePercent: 30,
        paymentTermsDays: 30,
        niche: values.niche || "general",
      }
    }, {
      onSuccess: () => {
        setLocation("/app/dashboard");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="ambient-orb ambient-orb-amber w-[600px] h-[600px] top-0 left-1/2 -translate-x-1/2 absolute animate-pulse-glow" />
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <FlowraFull className="flex items-center justify-center gap-2.5 mb-6" />
          <p className="text-label">ACCOUNT SETUP</p>
        </div>

        <div className="glass-card glow-inner p-8 space-y-8">
          <div className="text-center">
            <h1 className="font-editorial text-3xl font-light mb-2">Welcome to Flowra</h1>
            <p className="text-sm text-muted-foreground">Set up your creator business profile.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Business / Creator Name</FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:ring-primary/20 transition-all duration-500 rounded-lg"
                        placeholder="Your brand name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Country</FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:ring-primary/20 transition-all duration-500 rounded-lg"
                        placeholder="e.g. Nigeria, United States"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Niche</FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:ring-primary/20 transition-all duration-500 rounded-lg"
                          placeholder="e.g. Tech, Beauty"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Currency</FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:ring-primary/20 transition-all duration-500 rounded-lg"
                          placeholder="USD"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 btn-glow bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm rounded-lg"
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Launch Dashboard
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground font-mono">
                30% TAX RESERVE ENABLED BY DEFAULT · CONFIGURABLE IN SETTINGS
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

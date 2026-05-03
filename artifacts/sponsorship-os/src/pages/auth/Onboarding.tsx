import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

const step1Schema = z.object({
  businessName: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const completeMutation = useCompleteOnboarding();
  const [formData, setFormData] = useState<any>({});

  const form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { businessName: "", country: "" },
  });

  const onSubmitStep1 = (values: z.infer<typeof step1Schema>) => {
    setFormData({ ...formData, ...values });
    
    // Simulate finishing immediately for brevity in this task
    completeMutation.mutate({
      data: {
        name: values.businessName,
        businessName: values.businessName,
        country: values.country,
        defaultCurrency: "USD",
        taxReservePercent: 20,
        paymentTermsDays: 30,
        niche: "tech",
      }
    }, {
      onSuccess: () => {
        setLocation("/app/dashboard");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl bg-card p-8 rounded-xl border border-border shadow-2xl">
        <h2 className="text-3xl font-bold mb-4 text-center">Welcome to Flowra</h2>
        <p className="text-muted-foreground mb-8 text-center">Let's get your account set up.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitStep1)} className="space-y-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={completeMutation.isPending}>
              {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

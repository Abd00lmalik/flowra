import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLogin, useGoogleAuthInit } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const loginMutation = useLogin();
  const { refetch: initGoogleAuth } = useGoogleAuthInit({ query: { enabled: false } as any });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError("");
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (res) => {
          setToken(res.token);
          setLocation("/app/dashboard");
        },
        onError: (err: any) => {
          setError(err.message || "Failed to sign in");
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    const { data } = await initGoogleAuth();
    if (data && typeof data === 'object' && 'url' in data) {
      window.location.href = (data as any).url;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Or{" "}
            <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
              start your free trial
            </Link>
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && <div className="text-destructive text-sm font-medium text-center">{error}</div>}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

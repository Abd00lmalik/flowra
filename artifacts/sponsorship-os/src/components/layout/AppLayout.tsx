import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { FlowraLogo } from "@/components/FlowraLogo";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const token = getToken();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    } as any,
  });

  useEffect(() => {
    if (!token || isError) {
      setLocation("/login");
    } else if (user && user.needsOnboarding && !location.startsWith("/onboarding")) {
      setLocation("/onboarding");
    }
  }, [token, isError, user, location, setLocation]);

  if (isLoading || (!user && token)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <FlowraLogo className="w-12 h-12 animate-float" />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-label">LOADING DASHBOARD</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle background grid */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="bg-grid absolute inset-0 opacity-20" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";

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
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}

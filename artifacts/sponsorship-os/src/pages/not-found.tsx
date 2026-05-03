import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FlowraLogo } from "@/components/FlowraLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="bg-grid absolute inset-0 opacity-20" />
        <div className="ambient-orb ambient-orb-amber w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute" />
      </div>
      <div className="text-center relative z-10 animate-fade-in-up">
        <FlowraLogo className="w-16 h-16 mx-auto mb-8 opacity-30" />
        <p className="text-label mb-4">ERROR 404</p>
        <h1 className="font-editorial text-5xl font-light mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/">
          <Button variant="outline" className="border-white/[0.1] hover:bg-white/[0.04] transition-all duration-500">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}

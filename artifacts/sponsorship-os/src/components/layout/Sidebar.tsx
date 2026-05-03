import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  KanbanSquare,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  CreditCard,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { removeToken } from "@/lib/auth";
import { FlowraFull } from "@/components/FlowraLogo";

const navSections = [
  {
    label: "OPERATIONS",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/contracts", label: "Contracts", icon: FileText },
      { href: "/app/invoices", label: "Invoices", icon: FileSpreadsheet },
      { href: "/app/tax", label: "Tax Reserve", icon: PieChart },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { href: "/app/settings/integrations", label: "Integrations", icon: Zap },
      { href: "/app/settings/billing", label: "Billing", icon: CreditCard },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { href: "/app/settings/profile", label: "Profile", icon: Settings },
      { href: "/app/settings/api", label: "API Status", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        removeToken();
        setLocation("/");
      },
    });
  };

  return (
    <div className="flex flex-col w-64 border-r border-white/[0.06] h-screen sticky top-0" style={{ background: 'rgba(3,3,3,0.95)', backdropFilter: 'blur(20px)' }}>
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/app/dashboard" className="hover:opacity-80 transition-opacity duration-500">
          <FlowraFull className="flex items-center gap-2.5" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-label px-3 mb-2">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-500 text-sm",
                      isActive
                        ? "bg-primary/10 text-primary font-medium border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-500 text-left text-sm"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

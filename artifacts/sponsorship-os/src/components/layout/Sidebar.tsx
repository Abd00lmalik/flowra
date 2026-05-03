import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  PieChart,
  Settings,
  LogOut,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { removeToken } from "@/lib/auth";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/contracts", label: "Contracts", icon: FileText },
  { href: "/app/invoices", label: "Invoices", icon: FileSpreadsheet },
  { href: "/app/tax", label: "Tax Reserve", icon: PieChart },
  { href: "/app/settings/profile", label: "Settings", icon: Settings },
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
    <div className="flex flex-col w-64 border-r border-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="p-6">
        <Link href="/app/dashboard" className="text-xl font-bold tracking-tight text-primary">
          SponsorshipOS
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors text-left"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

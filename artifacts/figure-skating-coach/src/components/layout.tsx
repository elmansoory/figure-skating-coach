import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Activity, Users, ClipboardList, BookOpen, LayoutDashboard, Settings, Atom, BarChart3 } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/athletes", icon: Users, label: "Athletes" },
    { href: "/sessions", icon: Activity, label: "Sessions" },
    { href: "/training", icon: ClipboardList, label: "Training" },
    { href: "/rules", icon: BookOpen, label: "ISU Rules" },
    { href: "/physics", icon: Atom, label: "Physics Lab" },
    { href: "/analytics", icon: BarChart3, label: "Olympic Analytics" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold mr-3">
            FS
          </div>
          <span className="font-bold text-lg tracking-tight">SkateCoach Pro</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 mr-3", active ? "text-primary-foreground" : "text-muted-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center px-4 md:px-8 justify-between md:hidden">
          <span className="font-bold text-lg tracking-tight">SkateCoach Pro</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

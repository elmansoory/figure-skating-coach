import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Activity, Users, ClipboardList, BookOpen, LayoutDashboard, Settings, Atom, BarChart3, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/athletes", icon: Users, label: "اللاعبون" },
  { href: "/sessions", icon: Activity, label: "الجلسات" },
  { href: "/training", icon: ClipboardList, label: "برامج التدريب" },
  { href: "/rules", icon: BookOpen, label: "قواعد ISU" },
  { href: "/physics", icon: Atom, label: "مختبر الفيزياء" },
  { href: "/analytics", icon: BarChart3, label: "التحليلات الأولمبية" },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold" dir="ltr">
        FS
      </div>
      <span className="font-bold text-lg tracking-tight">SkateCoach Pro</span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="القائمة الرئيسية">
      {navItems.map((item) => {
        const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className="block" onClick={onNavigate} aria-current={active ? "page" : undefined}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function SettingsLink() {
  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer">
        <Settings className="w-5 h-5" />
        الإعدادات
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-e border-border bg-card flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Brand />
        </div>
        <NavLinks />
        <SettingsLink />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-3 md:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="فتح القائمة">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col" aria-describedby={undefined}>
              <SheetHeader className="h-16 px-6 border-b border-border flex justify-center">
                <SheetTitle asChild>
                  <div><Brand /></div>
                </SheetTitle>
              </SheetHeader>
              <NavLinks onNavigate={() => setMenuOpen(false)} />
              <SettingsLink />
            </SheetContent>
          </Sheet>
          <Brand />
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

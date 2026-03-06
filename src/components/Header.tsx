import { useState } from "react";
import { Bell, Search, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface HeaderProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  title: string;
}

export default function Header({ mobileOpen, setMobileOpen, title }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const typeColors: Record<string, string> = {
    warning: "bg-amber-100 text-amber-800",
    error: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md px-4 shadow-sm">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Page Title */}
      <h2 className="text-base font-bold text-foreground flex-1 lg:flex-none">{title}</h2>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-xs relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="بحث..."
          className="pr-9 h-8 text-sm bg-muted border-0 focus-visible:ring-1"
        />
      </div>

      <div className="flex items-center gap-2 mr-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <Bell className="h-4 w-4 text-foreground/70" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute left-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-bold">الإشعارات</h3>
                  <Badge variant="secondary" className="text-xs">{unread} جديد</Badge>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={cn("flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0", !n.read && "bg-muted/30")}>
                      <div className={cn("flex-shrink-0 mt-0.5 h-2 w-2 rounded-full", !n.read ? "bg-blue-500" : "bg-transparent")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-border text-center">
                  <button className="text-xs text-primary font-medium hover:underline">عرض جميع الإشعارات</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User */}
        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            م
          </div>
          <span className="hidden sm:block text-xs font-medium text-foreground">مدير النظام</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Package, FolderKanban, ShoppingCart, Users,
  Wrench, FileText, Settings, Bell, ChevronLeft,
  Building2, LogOut, Menu, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navGroups = [
  {
    label: "إدارة المشاريع",
    items: [
      { href: "/projects", icon: FolderKanban, label: "المشاريع" },
      { href: "/employees", icon: Users, label: "المقاولين" },
      { href: "/equipment", icon: Wrench, label: "المعدات والآليات" },
    ],
  },
  {
    label: "المخزون والمشتريات",
    items: [
      { href: "/inventory", icon: Package, label: "المخزون", badge: "2" },
      { href: "/items-catalog", icon: Package, label: "كتالوج الأصناف" },
      { href: "/warehouses", icon: Building2, label: "المستودعات" },
      { href: "/procurement", icon: ShoppingCart, label: "المشتريات والموردين" },
    ],
  },
  {
    label: "الوثائق",
    items: [
      { href: "/documents", icon: FileText, label: "المستندات والملفات" },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { href: "/settings", icon: Settings, label: "الإعدادات" },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-lg flex-shrink-0">
          <img src="/Watford_FC.svg.png" alt="Watford" className="h-6 w-6 object-contain" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-sidebar-foreground truncate">Watford</h1>
            <p className="text-xs text-sidebar-foreground/50">نظام إدارة المقاولات</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-hover transition-all flex-shrink-0"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/35">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "nav-item mb-0.5 group",
                    active
                      ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-hover",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5 flex-shrink-0", active ? "text-accent-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} style={{ width: "18px", height: "18px" }} />
                  {!collapsed && (
                    <span className="flex-1 text-sm">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className={cn(
                      "flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      item.badge === "!" ? "bg-red-500 text-white" : "bg-accent/20 text-accent"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex-shrink-0">
            {user?.full_name?.[0] || "م"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.full_name || "مستخدم"}</p>
              <p className="text-[10px] text-sidebar-foreground/40 truncate">{user?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-navy-800 transition-all duration-300 flex-shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-64 lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

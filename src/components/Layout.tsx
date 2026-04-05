import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageTitles: Record<string, string> = {
  "/": "إدارة المشاريع",
  "/projects": "إدارة المشاريع",
  "/inventory": "إدارة المخزون",
  "/warehouses": "المستودعات",
  "/procurement": "المشتريات والموردين",
  "/employees": "المقاولين",
  "/equipment": "المعدات والآليات",
  "/documents": "المستندات والملفات",
  "/settings": "الإعدادات",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "نظام إدارة المقاولات";

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

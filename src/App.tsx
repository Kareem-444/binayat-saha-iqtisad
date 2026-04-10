import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Projects from "./pages/Projects";
import Inventory from "./pages/Inventory";
import Procurement from "./pages/Procurement";
import Employees from "./pages/Employees";
import Equipment from "./pages/Equipment";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PermissionsList from "./pages/PermissionsList";
import PermissionForm from "./pages/PermissionForm";
import Warehouses from "./pages/Warehouses";
import { lazy, Suspense } from "react";

const ItemsCatalog = lazy(() => import("./pages/ItemsCatalog"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/projects" replace />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/inventory/permissions" element={<PermissionsList />} />
                      <Route path="/inventory/permissions/new" element={<PermissionForm />} />
                      <Route path="/inventory/permissions/edit/:id" element={<PermissionForm />} />
                      <Route path="/warehouses" element={<Warehouses />} />
                      <Route path="/procurement" element={<Procurement />} />

                      <Route path="/employees" element={<Employees />} />
                      <Route path="/equipment" element={<Equipment />} />
                      <Route path="/items-catalog" element={
                        <Suspense fallback={
                          <div className="flex h-screen items-center justify-center space-x-2" dir="rtl">
                            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-muted-foreground mr-3">جاري التحميل...</span>
                          </div>
                        }>
                          <ItemsCatalog />
                        </Suspense>
                      } />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

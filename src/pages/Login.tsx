import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "حدث خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
      style={{ background: "linear-gradient(160deg, hsl(221 83% 12%) 0%, hsl(221 70% 20%) 50%, hsl(38 96% 35%) 100%)" }}>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-500/10" />
        <div className="absolute top-1/3 left-1/4 h-48 w-48 rounded-full bg-white/3" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/Devcon_logo.png" alt="Devcon" className="h-20 object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-2xl font-black text-white">DEVCON</h1>
          <p className="text-white/50 text-sm mt-1">نظام إدارة المقاولات</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">تسجيل الدخول</h2>
          <p className="text-white/50 text-sm mb-6">أدخل بياناتك للوصول إلى النظام</p>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-3 mb-4">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">البريد الإلكتروني</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@construction.sa"
                required
                autoComplete="email"
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 pl-12 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 text-sm transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-center text-white/30 text-xs">
             
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © 2025 DEVCON — نظام إدارة المقاولات
        </p>
      </div>
    </div>
  );
}

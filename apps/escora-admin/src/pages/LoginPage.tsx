import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import escoraOfficialLogo from "@assets/escora/escora-official-logo.png";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    if (!result.ok) {
      setError("Invalid username or password. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        background: "linear-gradient(180deg, #FDFBF7 0%, #FAF8F3 50%, #F4F1E8 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background Subtle Luxury Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 20%, rgba(203, 171, 110, 0.12) 0%, transparent 60%)",
        }}
      />

      {/* Login Card */}
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl border border-[#E5E3D8] shadow-[0_20px_45px_-15px_rgba(24,61,46,0.08),0_0_0_1px_rgba(24,61,46,0.02)] p-8 sm:p-10 relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src={escoraOfficialLogo}
            alt="Escora Holidays"
            className="h-12 sm:h-14 w-auto object-contain mb-3.5 select-none"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E5E3D8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#183D2E]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#183D2E] uppercase">
              Admin Portal
            </span>
          </div>
          <p className="text-[12.5px] text-[#687D75] mt-2.5">
            Sign in to manage bespoke journeys & itineraries
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[#172923] mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C9B93]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-2.5 text-[13.5px] bg-[#FAF8F3]/60 focus:bg-white text-[#172923] placeholder-[#9CA3AF] border border-[#D8D5C8] focus:border-[#183D2E] rounded-lg outline-none transition-all duration-150 focus:ring-2 focus:ring-[#183D2E]/10"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[#172923] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C9B93]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 text-[13.5px] bg-[#FAF8F3]/60 focus:bg-white text-[#172923] placeholder-[#9CA3AF] border border-[#D8D5C8] focus:border-[#183D2E] rounded-lg outline-none transition-all duration-150 focus:ring-2 focus:ring-[#183D2E]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C9B93] hover:text-[#172923] transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50/80 border border-red-200/80 text-red-800 text-[12.5px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[#183D2E] hover:bg-[#122E22] active:bg-[#0D241A] text-white text-[12px] font-semibold tracking-[0.14em] uppercase transition-all duration-150 shadow-sm hover:shadow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Signing In…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-8 pt-5 border-t border-[#E5E3D8] text-center">
          <p className="text-[11.5px] text-[#8C9B93] tracking-wide">
            Escora Holidays · Private Admin Portal · Kochi, Kerala
          </p>
        </div>
      </div>
    </div>
  );
}

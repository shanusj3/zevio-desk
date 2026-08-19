import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Ticket, BarChart2, Users, Info, Check } from 'lucide-react';
import { loginSchema, LoginFormData } from '../lib/schemas';
import { useAppStore } from '../store/useAppStore';
import { authApi } from '../lib/api';

export const LoginPage: React.FC = () => {
  const { login, showToast } = useAppStore();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleInputChange = (field: keyof LoginFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (authError) setAuthError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof LoginFormData;
        if (fieldName && !formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.login(formData.email, formData.password);
      login({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        tenantId: response.user.tenantId,
      });
      showToast(`Welcome back, ${response.user.name}!`, 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex font-sans text-[#E2E8F0]">
      {/* Left Column - Marketing / Branding */}
      <div className="hidden lg:flex flex-col w-1/2 p-12 relative overflow-hidden">
        {/* Background Decorative Gradients for left side */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#D99B26]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img src="/logo.png" alt="Zevio Desk Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">ZEVIO DESK</h1>
            <p className="text-xs text-[#94A3B8]">Your Brand, Your Identity</p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="mt-20 max-w-lg relative z-10">
          <h2 className="text-5xl font-black text-white tracking-tight leading-[1.1]">
            Simplify Operations.<br />
            Deliver <span className="text-[#D99B26]">Better Service.</span>
          </h2>
          <p className="mt-6 text-[15px] text-[#94A3B8] leading-relaxed max-w-md font-medium">
            A modern platform to manage tickets, track performance and grow your business – all in one place.
          </p>

          {/* Features */}
          <div className="mt-12 space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#141b2b] border border-[#1e2a40] flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6 text-[#D99B26]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Effortless Ticket Management</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Create, assign and resolve tickets faster with a streamlined workflow.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#141b2b] border border-[#1e2a40] flex items-center justify-center shrink-0">
                <BarChart2 className="w-6 h-6 text-[#D99B26]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Actionable Insights</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Real-time reports and analytics to help you make smart decisions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#141b2b] border border-[#1e2a40] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-[#D99B26]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Team Collaboration</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Keep your team aligned and customers happy with smooth communication.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Graphic Element */}
        <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-[#141b2b]/50 to-transparent pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-64 h-64 opacity-20 pointer-events-none">
          {/* Abstract SVG representing the illustration in the mockup */}
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#D99B26" d="M45.7,-76.4C58.9,-69.3,69.1,-56,76.5,-42C83.9,-28,88.4,-14,87.6,-0.5C86.7,13,80.5,26,73.1,38.3C65.7,50.6,57.1,62.3,44.9,70.5C32.7,78.7,16.4,83.4,0.7,82.2C-15,81,-30,73.9,-43.3,64.9C-56.6,55.9,-68.2,45,-75.7,31.7C-83.2,18.4,-86.6,2.7,-84.3,-12.3C-82,-27.3,-74.1,-41.5,-63.1,-52.5C-52.1,-63.5,-38,-71.3,-24.1,-75.8C-10.2,-80.3,3.5,-81.4,17.4,-78.9C31.3,-76.4,45.7,-76.4,45.7,-76.4Z" transform="translate(100 100) scale(1.1)"/>
          </svg>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#7C3AED]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-[480px] bg-[#0f1522] rounded-[32px] p-10 sm:p-12 shadow-2xl border border-[#1e2a40] relative z-10">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center mb-6">
              <img src="/logo.png" alt="Zevio Desk Logo" className="w-14 h-14 object-contain" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome back <span className="inline-block animate-wave">👋</span></h2>
            <p className="text-[#64748B] text-sm mt-2 font-medium">Sign in to access your account</p>
          </div>

          {authError && (
            <div className="bg-[#7F1D1D]/30 border border-[#DC2626]/50 text-[#F87171] p-3 rounded-xl text-xs flex items-center gap-2 mb-6 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[#CBD5E1]">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full h-[52px] bg-[#141b2b] border ${
                    errors.email ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#23314a] focus:border-[#D99B26] focus:ring-[#D99B26]/10'
                  } rounded-xl pl-12 pr-4 text-[14px] text-white placeholder-[#64748B] focus:outline-none focus:ring-4 transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-bold text-[#CBD5E1]">
                  Password
                </label>
                <button type="button" className="text-[13px] font-bold text-[#D99B26] hover:text-[#E5A93C] transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full h-[52px] bg-[#141b2b] border ${
                    errors.password ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#23314a] focus:border-[#D99B26] focus:ring-[#D99B26]/10'
                  } rounded-xl pl-12 pr-12 text-[14px] text-white placeholder-[#64748B] focus:outline-none focus:ring-4 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-2 pb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors ${
                  formData.rememberMe ? 'bg-[#D99B26] border-[#D99B26]' : 'bg-[#141b2b] border-[#23314a] group-hover:border-[#D99B26]'
                }`}>
                  {formData.rememberMe && <Check className="w-3.5 h-3.5 text-[#0d121c]" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="hidden"
                />
                <span className="text-[13px] font-bold text-[#CBD5E1] select-none">Remember me</span>
              </label>

              <div className="flex items-center gap-1.5 text-[#64748B] hidden sm:flex">
                <span className="text-[12px] font-medium">Keep me signed in for 30 days</span>
                <Info className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[52px] bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-xl text-[15px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-[#D99B26]/10"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#0d121c] border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#1e2a40] flex items-center justify-center gap-2 text-[#64748B]">
            <Shield className="w-4 h-4 text-[#D99B26]" />
            <span className="text-xs font-medium">Secure login</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
          transform-origin: 70% 70%;
        }
      `}</style>
    </div>
  );
};

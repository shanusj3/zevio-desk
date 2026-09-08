import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { loginSchema, LoginFormData } from '../lib/schemas';
import { useAppStore } from '../store/useAppStore';
import { authApi, publicApi, PublicTenantInfo } from '../lib/api';
import { applyAndCacheTheme } from '../lib/theme';

function getDetectedSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  const parts = host.split('.');
  const searchParams = new URLSearchParams(window.location.search);
  const paramSlug = searchParams.get('tenant');

  if (paramSlug) return paramSlug;
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0];
  }
  return null;
}

function getInitialTenantInfo(slug: string | null): PublicTenantInfo | null {
  if (!slug || typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`zevio_theme_${slug}`) ||
      localStorage.getItem(`zevio_theme_${window.location.hostname}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        id: '',
        name: parsed.name || '',
        slug: slug,
        logoUrl: parsed.logoUrl || null,
        primaryColor: parsed.primaryColor || '#116dff',
      };
    }
  } catch (e) { }
  return null;
}

export const LoginPage: React.FC = () => {
  const { login, showToast } = useAppStore();

  const [detectedSlug] = useState<string | null>(() => getDetectedSlug());
  const [tenantInfo, setTenantInfo] = useState<PublicTenantInfo | null>(() => getInitialTenantInfo(detectedSlug));
  const [isTenantLoading, setIsTenantLoading] = useState<boolean>(() => Boolean(detectedSlug && !tenantInfo));

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch fresh public tenant branding in background
  useEffect(() => {
    if (!detectedSlug) {
      setIsTenantLoading(false);
      return;
    }

    publicApi.getTenantPublicInfo(detectedSlug)
      .then((info) => {
        if (info) {
          setTenantInfo(info);
          applyAndCacheTheme({
            name: info.name,
            primaryColor: info.primaryColor || '#116dff',
            logoUrl: info.logoUrl,
          }, info.slug);
        }
      })
      .catch(() => {
        // Keep cached theme if network query fails
      })
      .finally(() => {
        setIsTenantLoading(false);
      });
  }, [detectedSlug]);

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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 font-sans text-[#1e293b]">
      {/* Clean Minimal White Login Form Card Centered */}
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 relative z-10 space-y-6">

        {/* Centered Brand Header (Zero-flicker cached or tenant logo) */}
        <div className="flex flex-col items-center text-center">
          <div className="h-16 flex items-center justify-center mb-4">
            {isTenantLoading ? (
              /* Subtle skeleton loader while first-time cold visit loads */
              <div className="h-14 w-44 bg-slate-100 rounded-xl animate-pulse" />
            ) : tenantInfo?.logoUrl ? (
              <img
                src={tenantInfo.logoUrl}
                alt={tenantInfo.name || 'Tenant Logo'}
                className="h-14 lg:h-16 object-contain"
              />
            ) : (
              <img
                src="/zeviodesk-logo-brand.png"
                alt="ZevioDesk Logo"
                className="h-14 lg:h-16 object-contain"
              />
            )}
          </div>

          {isTenantLoading ? (
            <div className="h-7 w-48 bg-slate-100 rounded-lg animate-pulse mx-auto mb-1" />
          ) : (
            <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
              {tenantInfo?.name ? `Sign in to ${tenantInfo.name}` : 'Sign in to continue'}
            </h2>
          )}


        </div>

        {authError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div className="space-y-1">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email"
                className={`w-full h-11 bg-slate-100 border ${errors.email ? 'border-rose-500 focus:bg-white' : 'border-transparent focus:border-slate-300 focus:bg-white'
                  } rounded-xl pl-11 pr-4 text-xs font-semibold text-[#0f172a] placeholder:text-slate-400 outline-none transition-all`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 pl-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Password"
                className={`w-full h-11 bg-slate-100 border ${errors.password ? 'border-rose-500 focus:bg-white' : 'border-transparent focus:border-slate-300 focus:bg-white'
                  } rounded-xl pl-11 pr-11 text-xs font-semibold text-[#0f172a] placeholder:text-slate-400 outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 pl-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#0f172a] hover:bg-black text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Security badge */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold">Secure SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};

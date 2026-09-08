export interface TenantTheme {
  name?: string | null;
  primaryColor: string;
  logoUrl?: string | null;
}

export const DEFAULT_THEME: TenantTheme = {
  name: null,
  primaryColor: '#116dff',
  logoUrl: null,
};

export function getTenantCacheKey(slug?: string): string {
  if (typeof window === 'undefined') return 'zevio_theme_default';
  const tenantKey = slug || window.location.hostname || 'default';
  return `zevio_theme_${tenantKey}`;
}

export function isSameTheme(a?: Partial<TenantTheme> | null, b?: Partial<TenantTheme> | null): boolean {
  if (!a || !b) return false;
  return (
    (a.name ?? null) === (b.name ?? null) &&
    (a.primaryColor || '#116dff') === (b.primaryColor || '#116dff') &&
    (a.logoUrl ?? null) === (b.logoUrl ?? null)
  );
}

export function applyAndCacheTheme(theme: Partial<TenantTheme>, tenantSlug?: string) {
  if (typeof window === 'undefined') return;

  const primaryColor = theme.primaryColor || '#116dff';
  const logoUrl = theme.logoUrl ?? null;
  const name = theme.name ?? null;

  const fullTheme: TenantTheme = { name, primaryColor, logoUrl };

  // Update CSS root variables dynamically (triggers index.css var(--tenant-primary) rules)
  const root = document.documentElement.style;
  root.setProperty('--tenant-primary', primaryColor);
  root.setProperty('--color-primary', primaryColor);
  root.setProperty('--color-brand', primaryColor);
  root.setProperty('--tenant-primary-dark', adjustBrightness(primaryColor, -0.12));
  root.setProperty('--tenant-primary-tint', hexToRgba(primaryColor, 0.10));
  root.setProperty('accent-color', primaryColor);

  if (typeof document !== 'undefined' && document.body) {
    const bodyStyle = document.body.style;
    bodyStyle.setProperty('--tenant-primary', primaryColor);
    bodyStyle.setProperty('--color-primary', primaryColor);
    bodyStyle.setProperty('--color-brand', primaryColor);
    bodyStyle.setProperty('--tenant-primary-dark', adjustBrightness(primaryColor, -0.12));
    bodyStyle.setProperty('--tenant-primary-tint', hexToRgba(primaryColor, 0.10));
  }

  if (logoUrl) {
    root.setProperty('--logo-url', `url(${logoUrl})`);
  } else {
    root.removeProperty('--logo-url');
  }
  // Clean up any old dynamic style element if present to avoid class substring selector contamination
  const oldStyleEl = document.getElementById('tenant-primary-override');
  if (oldStyleEl) {
    oldStyleEl.remove();
  }

  // 3. Store in tenant-isolated localStorage key for zero-flicker pre-mount index.html script
  try {
    const cacheKey = getTenantCacheKey(tenantSlug);
    localStorage.setItem(cacheKey, JSON.stringify(fullTheme));
    // Also save under current hostname key as fallback
    localStorage.setItem(`zevio_theme_${window.location.hostname}`, JSON.stringify(fullTheme));
    (window as any).__INITIAL_THEME__ = fullTheme;
  } catch (e) {
    // Ignore storage quota errors
  }
}

/** Convert hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return `rgba(17, 109, 255, ${alpha})`;
  }
}

/** Darken or lighten a hex color by a factor (-1 to 1) */
function adjustBrightness(hex: string, factor: number): string {
  try {
    const h = hex.replace('#', '');
    const r = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 + factor))));
    const g = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 + factor))));
    const b = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 + factor))));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return hex;
  }
}

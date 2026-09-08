# Refactoring Baseline Report

> **Project:** ZevioDesk React Frontend (`zeviodesk-frontend`)  
> **Branch:** `optimize_frontend`  
> **Date:** September 8, 2026  
> **Purpose:** Establish a safe baseline before refactoring.  

---

## 1. Git Status

```
On branch optimize_frontend
Your branch is up to date with 'origin/optimize_frontend'.

Changes not staged for commit:
  modified:   zeviodesk-frontend/package-lock.json
  modified:   zeviodesk-frontend/package.json
  modified:   zeviodesk-frontend/src/components/BillingDomainView.tsx
  deleted:    zeviodesk-frontend/src/components/CatalogCategoriesPage.tsx
  deleted:    zeviodesk-frontend/src/components/CatalogProductsPage.tsx
  deleted:    zeviodesk-frontend/src/components/CreateProductPage.tsx
  deleted:    zeviodesk-frontend/src/components/CreateTicketModal.tsx
  deleted:    zeviodesk-frontend/src/components/CreateTicketPage.tsx
  deleted:    zeviodesk-frontend/src/components/CustomersTab.tsx
  deleted:    zeviodesk-frontend/src/components/DashboardOverviewTab.tsx
  deleted:    zeviodesk-frontend/src/components/EditTicketPage.tsx
  deleted:    zeviodesk-frontend/src/components/GenerateInvoicePage.tsx
  deleted:    zeviodesk-frontend/src/components/InventoryPage.tsx
  deleted:    zeviodesk-frontend/src/components/InvoicesPage.tsx
  deleted:    zeviodesk-frontend/src/components/LoginPage.tsx
  deleted:    zeviodesk-frontend/src/components/NewInvoicePage.tsx
  deleted:    zeviodesk-frontend/src/components/ProfilePage.tsx
  deleted:    zeviodesk-frontend/src/components/PublicTrackingPage.tsx
  deleted:    zeviodesk-frontend/src/components/ReadyForPickupPage.tsx
  deleted:    zeviodesk-frontend/src/components/ReportsView.tsx
  deleted:    zeviodesk-frontend/src/components/SettingsView.tsx
  deleted:    zeviodesk-frontend/src/components/SetupPasswordPage.tsx
  deleted:    zeviodesk-frontend/src/components/StaffTab.tsx
  deleted:    zeviodesk-frontend/src/components/TenantAdminDashboard.tsx
  deleted:    zeviodesk-frontend/src/components/TenantReportsView.tsx
  deleted:    zeviodesk-frontend/src/components/TicketDetailsPage.tsx
  deleted:    zeviodesk-frontend/src/components/TicketsTab.tsx
  deleted:    zeviodesk-frontend/src/components/WhatsAppInbox.tsx

Untracked files:
  zeviodesk-frontend/audit/
```

---

## 2. Validation Results Summary

| Validation | Command Executed | Result | Exit Code | Notes |
|---|---|---|---|---|
| **TypeScript / Lint** | `npm run lint` (`tsc --noEmit`) | **PASSED** | `0` | Clean type-checking across all `.ts` and `.tsx` files. |
| **Vite Production Build** | `npm run build` (`vite build`) | **PASSED** | `0` | Transformed 2342 modules. Dist bundle generated in 21.16s. |
| **Test Suite** | N/A | N/A | N/A | No `"test"` script configured in `package.json`. |
| **Playwright Configuration** | N/A | N/A | N/A | `@playwright/test` installed in `devDependencies`. No `playwright.config.ts` configured yet. |

---

## 3. Existing Errors & Warnings

### Errors:
- **Zero TypeScript errors** (`tsc --noEmit` exited cleanly).
- **Zero Vite compilation errors** (`vite build` exited cleanly).

### Warnings:
- **Large Chunk Size Warning (Vite Build):**
  `(!) Some chunks are larger than 500 kB after minification.`  
  `dist/assets/index-Cd_b1QXg.js` size: **1,254.23 kB** (311.73 kB gzipped).  
  *Recommendation for future phases:* Implement code-splitting using `manualChunks` or dynamic `import()` for heavy routes (`GenerateInvoicePage`, `TenantReportsView`, `TicketDetailsPage`).

---

## 4. Current Project Configuration

### A. `package.json`
- **React Version:** `^19.0.1`
- **React Router:** `^7.18.2`
- **TanStack Query:** `^5.101.4`
- **Tailwind CSS:** `^4.1.14` (`@tailwindcss/vite`)
- **State Management:** `zustand ^5.0.14`
- **Bundler:** `vite ^6.2.3`
- **TypeScript:** `~5.8.2`

### B. `tsconfig.json`
- **Target:** `ES2022`
- **Module Resolution:** `bundler`
- **JSX:** `react-jsx`
- **Path Aliases:** `"@/*": ["./*"]`
- **No Emit:** `true`

### C. `vite.config.ts`
- **Plugins:** `react()`, `tailwindcss()`
- **Path Alias:** `@ -> .`
- **Dev Proxy:** `/api` -> `http://localhost:3001`

---

## 5. Current Project Directory Structure

```
zeviodesk-frontend/
├── audit/                     # Audit documentation & baseline reports
├── public/                    # Static public assets
├── src/
│   ├── assets/                # Images & media assets
│   ├── components/            # Shared components (PageHeader, StatusBadge, Tables, Modals)
│   │   ├── attachments/
│   │   ├── data-table/
│   │   └── ui/                # UI primitives (Badge, Dialog, Drawer)
│   ├── data/                  # Static mock data / reference lists
│   ├── hooks/                 # Custom React Query hooks (useTicketsQuery, useInventoryQuery, etc.)
│   ├── layouts/               # Shell layout (AppLayout.tsx)
│   ├── lib/                   # Central API client (api.ts), tax, warranty, navigation
│   ├── pages/                 # All 27 application route view pages
│   ├── routes/                # Route Provider (AppRoutes.tsx)
│   ├── services/              # Attachment API service
│   ├── store/                 # Zustand store (useAppStore.ts)
│   ├── types/                 # Type definitions
│   ├── App.tsx                # Main auth/tenant router container
│   ├── index.css              # Main Tailwind stylesheet
│   └── main.tsx               # Application entrypoint
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 6. Validation Commands Used

1. **Git Status Check:**
   ```bash
   git status
   ```

2. **TypeScript / Lint Validation:**
   ```bash
   npm run lint
   ```
   *(Executes `tsc --noEmit`)*

3. **Vite Production Build Validation:**
   ```bash
   npm run build
   ```
   *(Executes `vite build`)*

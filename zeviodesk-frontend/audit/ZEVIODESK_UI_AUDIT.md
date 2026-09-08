# ZevioDesk UI & Code Audit

> **Audit Type:** Read-Only Static & Structural Inspection  
> **Target Codebase:** `zeviodesk-frontend` (React + TypeScript + Tailwind CSS)  
> **Date:** September 8, 2026  

---

## 1. Project Overview

ZevioDesk Frontend is a multi-tenant repair shop management, ticketing, catalog, inventory, invoicing, and reporting web application built with **React 18**, **TypeScript**, **Tailwind CSS**, **Lucide React**, **TanStack Query (React Query v5)**, **Zustand**, and **React Router DOM (v6)**.

### Key Metrics:
- **Total Pages / Views:** 27 distinct view screens
- **Total Component Files:** 64 files in `src/components/` (including 24 page re-export wrappers)
- **Total Custom Query Hooks:** 7 files in `src/hooks/`
- **Global Store:** 1 Zustand store (`useAppStore.ts`)
- **API Services:** 1 central API client (`src/lib/api.ts`, 1,351 lines) + 1 attachment service (`attachment-api.ts`)
- **Layouts:** 1 App Shell (`AppLayout.tsx`)
- **Route Provider:** 1 Router config (`AppRoutes.tsx`)

---

## 2. All Routes

The application features 27 distinct route paths across 3 access tiers (Public/Auth, App Shell Layout, and Super Admin):

### A. Public & Authentication Routes (No App Shell)
1. `/login` — `LoginPage.tsx` (Unauthenticated state fallback)
2. `/setup-password?token=...` — `SetupPasswordPage.tsx` (Token-based user onboarding)
3. `/track/:ticketNumber` — `PublicCustomerTrackingPage.tsx` / `PublicTrackingPage.tsx` (Customer repair status tracking)

### B. Standard Application Routes (Wrapped in `AppLayout`)
4. `/` / `/dashboard` — `DashboardOverviewTab.tsx` (Main operational KPI dashboard)
5. `/customers` — `CustomersTab.tsx` (Customer directory & management)
6. `/staff` — `StaffTab.tsx` (Employee & technician management)
7. `/settings/*` — `SettingsView.tsx` (Workshop settings & tabs)
   - `/settings/profile` — User profile settings
   - `/settings/company` — Workshop company profile
   - `/settings/billing` — Subscription & plan billing
   - `/settings/sales` — Sales & tax preferences
   - `/settings/whatsapp` — Meta WABA WhatsApp integration settings
   - `/settings/inventory` — Storage & stock tracking modes
   - `/settings/invoice-template` — Invoice visual layout customizer
   - `/settings/catalog` — Item catalog configuration
8. `/catalog/products` — `CatalogProductsPage.tsx` (Product catalog list)
9. `/catalog/products/new` — `CreateProductPage.tsx` (New product creation)
10. `/catalog/products/:productId` — `CreateProductPage.tsx` (Product edit mode)
11. `/catalog/categories` — `CatalogCategoriesPage.tsx` (Product category manager)
12. `/catalog/categories/:categoryId` — `CatalogCategoriesPage.tsx` (Category detail view)
13. `/catalog/inventory` — `InventoryPage.tsx` (Spare parts & stock tracking)
14. `/tickets` — `TicketsTab.tsx` (All repair tickets queue)
15. `/tickets/new` — `CreateTicketPage.tsx` (New repair ticket intake form)
16. `/tickets/my-repairs` — `MyRepairsPage.tsx` (Technician assigned repairs queue)
17. `/tickets/repair-completed` — `RepairCompletedPage.tsx` (Repaired tickets waiting QA/Notification)
18. `/tickets/ready-for-pickup` — `ReadyForPickupPage.tsx` (Tickets ready for customer handover)
19. `/tickets/:ticketId` — `TicketDetailsPage.tsx` (Comprehensive ticket detail, line items, & activity)
20. `/tickets/:ticketId/edit` — `EditTicketPage.tsx` (Ticket editor)
21. `/tickets/:ticketId/billing` — `GenerateInvoicePage.tsx` (Full-screen billing, invoice PDF generator & payments)
22. `/inbox` — `WhatsAppInbox.tsx` (Live WhatsApp customer chat inbox)
23. `/reports/highlights` — `TenantReportsView.tsx` (initialTab="overview")
24. `/reports/repairs` — `TenantReportsView.tsx` (initialTab="tickets")
25. `/reports/financials` — `TenantReportsView.tsx` (initialTab="revenue")
26. `/reports/inventory` — `TenantReportsView.tsx` (initialTab="inventory")
27. `/reports/*` — `TenantReportsView.tsx` (Fallback reports route)

---

## 3. Component Inventory

### A. Core Page Components (`src/pages/`)
1. `CatalogCategoriesPage.tsx` (33.7 KB)
2. `CatalogProductsPage.tsx` (10.1 KB)
3. `CreateProductPage.tsx` (33.6 KB)
4. `CreateTicketPage.tsx` (46.9 KB)
5. `CustomersTab.tsx` (5.2 KB)
6. `DashboardOverviewTab.tsx` (11.5 KB)
7. `EditTicketPage.tsx` (16.7 KB)
8. `GenerateInvoicePage.tsx` (99.9 KB)
9. `InventoryPage.tsx` (42.7 KB)
10. `InvoicesPage.tsx` (10.2 KB)
11. `LoginPage.tsx` (9.7 KB)
12. `MyRepairsPage.tsx` (11.9 KB)
13. `NewInvoicePage.tsx` (18.8 KB)
14. `ProfilePage.tsx` (5.8 KB)
15. `PublicCustomerTrackingPage.tsx` (20.2 KB)
16. `PublicTrackingPage.tsx` (2.6 KB)
17. `ReadyForPickupPage.tsx` (9.9 KB)
18. `RepairCompletedPage.tsx` (8.7 KB)
19. `ReportsView.tsx` (10.8 KB)
20. `SettingsView.tsx` (21.1 KB)
21. `SetupPasswordPage.tsx` (12.5 KB)
22. `StaffTab.tsx` (2.6 KB)
23. `TenantAdminDashboard.tsx` (5.6 KB)
24. `TenantReportsView.tsx` (72.8 KB)
25. `TicketDetailsPage.tsx` (138.4 KB)
26. `TicketsTab.tsx` (3.0 KB)
27. `WhatsAppInbox.tsx` (34.2 KB)

### B. Real Shared Components (`src/components/`)
1. `Header.tsx` (Top navigation bar, notifications, user profile menu)
2. `Sidebar.tsx` (Left main navigation drawer)
3. `PageHeader.tsx` (Page title, count badge, primary action, CSV export/import)
4. `TicketsTable.tsx` (Ticket list table with search, status filters, bulk actions)
5. `CustomersTable.tsx` (Customer directory table with search, export)
6. `TenantsTable.tsx` (Super admin multi-tenant table)
7. `EmployeesTable.tsx` (Staff/technicians table)
8. `StatusBadge.tsx` (Ticket/customer/invoice status pill badges)
9. `StatCard.tsx` (KPI stat card container)
10. `EditorialKpiCard.tsx` & `EditorialKpiSection.tsx` (Stylized KPI summary cards)
11. `PartSearchCombo.tsx` (Inventory product search combobox)
12. `ItemModelSearch.tsx` (Device model search combobox)
13. `TicketStatusStepper.tsx` (Ticket lifecycle progress bar)
14. `TenantDetailsDrawer.tsx` (Tenant details drawer for super admin)
15. `TicketDetailsDrawer.tsx` (Ticket side drawer wrapper)
16. `WarrantyModal.tsx` (Warranty selection & details modal)
17. `ExportScopeModal.tsx` (CSV export scope options modal)
18. `ImportModal.tsx` & `ImportCsvModal.tsx` (CSV import modals)
19. `ConfirmationModal.tsx` (Action confirmation dialog)
20. `CreateCustomerModal.tsx` (Customer creation dialog)
21. `CreateEmployeeModal.tsx` (Employee creation dialog)
22. `CreateTenantModal.tsx` (Tenant creation dialog)
23. `CreateTicketModal.tsx` (Modal version of ticket intake form)
24. `AddStatsModal.tsx` (Custom KPI stats builder modal)
25. `WhatsAppSetupModal.tsx` (WABA connection wizard modal)
26. `Skeleton.tsx` & `TicketDetailsSkeleton.tsx` (Shimmer loading placeholders)
27. `DateFilter.tsx` (Date range selector dropdown)
28. `InvoiceDetailView.tsx` (Invoice preview modal/drawer)
29. `InvoiceTemplateSettings.tsx`, `InventorySettings.tsx`, `ItemCatalogSettings.tsx`, `WhatsAppSettings.tsx`, `BillingDomainView.tsx`, `SalesDomainView.tsx`, `PaymentsView.tsx`, `RefundsView.tsx` (Settings sub-tabs)
30. `ui/Badge.tsx`, `ui/Dialog.tsx`, `ui/Drawer.tsx` (UI Primitives)

---

## 4. Repeated UI Components

### 1. Buttons
- **Primary Buttons:** Blue gradient/solid buttons (`bg-[#116dff] hover:bg-[#0052cc] text-white font-bold rounded-xl h-10 px-5`). Re-implemented inline across ~20 files with slight variations (`rounded-lg` vs `rounded-xl` vs `rounded-2xl`).
- **Secondary / Ghost Buttons:** Light slate buttons (`bg-[#f8fafc] border border-[#dfe5eb] text-[#334155] hover:bg-[#f1f5f9]`). Repeated in modal footers and table headers.
- **Action Icon Buttons:** Icon-only square buttons (`p-1.5 text-[#94a3b8] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg`). Repeated for edit, delete, history, print actions.

### 2. Search & Filter Bars
- Re-implemented with identical JSX (`<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />`) and `<input className="w-full h-11 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-10 pr-4 text-xs text-[#1e293b]...">` in:
  - `TicketsTable.tsx`
  - `CustomersTable.tsx`
  - `InventoryPage.tsx`
  - `TenantsTable.tsx`
  - `EmployeesTable.tsx`
  - `CatalogProductsPage.tsx`
  - `CatalogCategoriesPage.tsx`
  - `InvoicesPage.tsx`
  - `TenantReportsView.tsx`

### 3. Pagination Bars
- Re-implemented with identical markup (`Showing X to Y of Z items`, `Previous`, `Next` buttons) in 7 separate table files instead of using a shared `<Pagination />` component.

### 4. Empty & Loading States
- **Empty States:** Centered icon circle (`w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center border border-[#e2e8f0]`) + bold title + description re-written in 9 files.
- **Loading Skeletons:** Separate skeleton implementations in `Skeleton.tsx`, `TicketDetailsSkeleton.tsx`, and inline skeleton loops in `TenantsTable.tsx`, `CustomersTable.tsx`, `TicketsTable.tsx`.

### 5. Modals & Drawers
- **Modal Containers:** Fixed overlay (`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs`) + card (`bg-white border border-[#dfe5eb] rounded-2xl shadow-xl`) duplicated across 14 modal files.
- **Drawers:** `ui/Drawer.tsx` exists, but `TenantDetailsDrawer.tsx`, `TicketDetailsDrawer.tsx`, and `StockMovementsDrawer` implement custom drawer slide-over containers.

---

## 5. Repeated Code

### 1. Currency Formatting Logic
The money formatting function is redefined inline in 6 different files:
```tsx
// Copied in InventoryPage.tsx, GenerateInvoicePage.tsx, TicketDetailsPage.tsx, TicketsTable.tsx, TenantReportsView.tsx, InvoiceDetailView.tsx
const money = (val: string | number | null | undefined) => {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
```

### 2. Date & Time Formatting
Date formatting logic (`toLocaleDateString`, `toLocaleTimeString`, "Yesterday", "X days ago") is re-implemented in `Header.tsx`, `WhatsAppInbox.tsx`, `TicketsTable.tsx`, `TicketDetailsPage.tsx`, `InvoiceDetailView.tsx`.

### 3. CSV Export Mapping
The CSV export helper `downloadCsv` is shared, but header definitions and row formatting logic are copy-pasted across `TicketsTable.tsx`, `CustomersTable.tsx`, `InventoryPage.tsx`, `CatalogProductsPage.tsx`, and `TenantReportsView.tsx`.

### 4. Status Color Mappings
Status colors (`DELIVERED`, `REPAIRED`, `IN_PROGRESS`, `PENDING_PARTS`, `CANCELLED`) are mapped to Tailwind color classes independently inside `StatusBadge.tsx`, `TicketsTable.tsx`, `TicketDetailsPage.tsx`, `MyRepairsPage.tsx`, `RepairCompletedPage.tsx`, `ReadyForPickupPage.tsx`.

---

## 6. Repeated Hooks

The custom hooks directory (`src/hooks/`) has 7 domain query files:
1. `useTicketsQuery.ts` (14 query/mutation hooks)
2. `useCustomersQuery.ts` (4 query/mutation hooks)
3. `useInventoryQuery.ts` (8 query/mutation hooks)
4. `useInvoicesQuery.ts` (5 query/mutation hooks)
5. `useTenantsQuery.ts` (5 query/mutation hooks)
6. `useUsersQuery.ts` (4 query/mutation hooks)
7. `useReportsQuery.ts` (1 query hook)

### Duplication Patterns:
- **Query Invalidation:** Every mutation hook explicitly calls `queryClient.invalidateQueries({ queryKey: [...] })` with manual query key arrays instead of a centralized query key factory.
- **Local Search & Filter Debouncing:** Debounced search state logic is re-written inside `PartSearchCombo.tsx`, `ItemModelSearch.tsx`, `TicketsTable.tsx`, and `CustomersTable.tsx`.

---

## 7. Repeated API Logic

- `src/lib/api.ts` contains 1,351 lines defining all API endpoints (`authApi`, `tenantApi`, `userApi`, `ticketApi`, `customerApi`, `invoiceApi`, `lineItemsApi`, `paymentsApi`, `inventoryApi`, `reportsApi`, `whatsappApi`).
- `src/services/attachment-api.ts` defines attachment upload endpoints separately using raw `fetch` instead of using the central `request` wrapper from `api.ts`.
- `useAppStore.ts` contains a raw `fetch('/api/auth/logout')` call bypassing `authApi.logout()`.

---

## 8. Repeated CSS/Tailwind

### Frequently Repeated Tailwind Token Strings:
- **Standard Input Box:**
  `"w-full h-11 px-4 rounded-xl bg-[#f8fafc] border border-[#dfe5eb] text-sm text-[#1e293b] placeholder-[#94a3b8] focus:border-[#116dff] outline-none transition-colors"`
- **Primary Action Button:**
  `"h-10 px-5 rounded-xl text-xs font-bold bg-[#116dff] hover:bg-[#0052cc] text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs"`
- **Secondary Action Button:**
  `"h-10 px-4 rounded-xl text-xs font-semibold bg-[#f8fafc] border border-[#dfe5eb] text-[#334155] hover:bg-[#f1f5f9] transition-colors cursor-pointer"`
- **Card Container:**
  `"bg-white border border-[#dfe5eb] rounded-2xl p-6 shadow-xs"`
- **Modal Overlay:**
  `"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"`
- **Modal Content Dialog:**
  `"w-full max-w-md bg-white border border-[#dfe5eb] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"`

---

## 9. Page-by-Page UI Analysis

| Page / Component | Key UI Elements | Duplicated Patterns Identified | Refactoring Risk |
|---|---|---|---|
| **`DashboardOverviewTab`** | KPI Cards, Recent Tickets, Quick Actions | Custom KPI cards, status badges, ticket navigation | Low |
| **`TicketsTab`** | PageHeader, TicketsTable | Search bar, filter dropdowns, pagination, status pills, CSV export | Low |
| **`TicketDetailsPage`** | Header, Stepper, Line Items, Comments, Payments, Modals | Status badge, currency format, date format, warranty modal, payment form | Medium |
| **`GenerateInvoicePage`** | Full-screen Billing, Line items, Tax, Print preview, Payment modal | Money format, line item calculations, tax summary, payment split form | High |
| **`CustomersTab`** | PageHeader, CustomersTable, Create Customer Modal | Search, filter, pagination, empty state, CSV export | Low |
| **`StaffTab`** | PageHeader, EmployeesTable, Create Employee Modal | Search, filter, role badge, pagination, edit modal | Low |
| **`InventoryPage`** | PageHeader, Parts Table, Adjust Modal, Move Drawer | Search, category filter, low stock alert, pagination, stock adjustment dialog | Low |
| **`CatalogProductsPage`** | Products Table, Search, Category filter | Product table header, search, pagination, status pills | Low |
| **`CatalogCategoriesPage`** | Category List, Product List | Category selection, product table, search bar | Low |
| **`InvoicesPage`** | Invoice Table, Status filter | Search bar, date filter, status pills, pagination | Low |
| **`MyRepairsPage`** | Technician Tickets Table | Simplified TicketsTable view with custom row rendering | Medium |
| **`RepairCompletedPage`** | Completed Queue Table | Custom filter & row rendering of completed tickets | Medium |
| **`ReadyForPickupPage`** | Pickup Queue Table | Custom filter & row rendering of ready tickets | Medium |
| **`TenantReportsView`** | Report Tab Bar, KPI Cards, Bar Charts, Pie Charts | Stat cards, table rows, CSV export, date range picker | Medium |
| **`WhatsAppInbox`** | Conversation list, Chat thread, Customer sidebar | Message input, status badges, avatar circle, date/time format | High |
| **`SettingsView`** | Vertical Settings Tabs, Sub-views | Tab navigation, form inputs, save buttons | Low |
| **`ProfilePage`** | User Profile Hero Card, Details grid | Profile avatar circle, access badge, detail cards | Low |
| **`TenantAdminDashboard`** | Multi-tenant KPI Grid, TenantsTable | KPI cards, status badges, tenant create/edit drawer | Low |
| **`LoginPage`** | Auth form box, Logo, Inputs | Input fields, submit button, error message banner | Low |
| **`PublicCustomerTrackingPage`** | Customer Ticket Status, Progress Stepper, Comments | Stepper component, status badge, ticket detail card | Low |

---

## 10. Components That Should Become Reusable

| Candidate Component | Current Locations | Proposed Location | Purpose |
|---|---|---|---|
| **`<DataTable />`** | `TicketsTable`, `CustomersTable`, `TenantsTable`, `EmployeesTable`, `InventoryPage`, `CatalogProductsPage` | `src/components/common/DataTable.tsx` | Generic table with built-in search, filtering, pagination, sorting, and empty states |
| **`<Modal />`** | 14 modal components and inline page modals | `src/components/ui/Modal.tsx` | Standardized accessible dialog backdrop, header, body, and footer container |
| **`<Pagination />`** | 7 table components | `src/components/common/Pagination.tsx` | Standardized page count label and Prev/Next controls |
| **`<SearchInput />`** | 9 pages/tables | `src/components/ui/SearchInput.tsx` | Standardized search input with search icon, clear button, and focus styling |
| **`<KpiCard />`** | `StatCard`, `EditorialKpiCard`, `DashboardOverviewTab`, `TenantReportsView` | `src/components/common/KpiCard.tsx` | Unified metric summary card with icon, title, value, change indicator |
| **`formatCurrency()`** | 6 files | `src/utils/formatters.ts` | Centralized Indian Rupee (`₹`) & multi-currency formatter |
| **`formatDateTime()`** | 5 files | `src/utils/formatters.ts` | Centralized date and relative time formatter |

---

## 11. Components That Should NOT Be Merged

1. **`TicketDetailsPage` vs `GenerateInvoicePage`**:
   - *Why:* `TicketDetailsPage` manages live repair intake, technician assignments, activity logs, and line item changes. `GenerateInvoicePage` manages formal GST/tax compliance, price mode overrides, rounding rules, invoice PDF layout, and legal financial receipts. Merging would create an overly complex, fragile component.
2. **`WhatsAppInbox` vs Ticket Internal Comments**:
   - *Why:* `WhatsAppInbox` handles real-time WebSocket external Meta WABA customer messaging and chat threads. Ticket internal comments handle private internal staff notes.
3. **`CatalogProductsPage` vs `InventoryPage`**:
   - *Why:* Catalog products define master SKU items, prices, and warranties. Inventory tracks physical stock counts, warehouse location bins, minimum alert thresholds, and movement audit logs.
4. **`TenantAdminDashboard` vs `DashboardOverviewTab`**:
   - *Why:* Super admin multi-tenant dashboard operates across all tenant shops, while workshop dashboard operates within a single tenant store context.

---

## 12. Potential Dead/Unused Code

1. **24 Component Re-export Wrappers in `src/components/`**:
   - Files like `src/components/InventoryPage.tsx` (containing only `export * from '../pages/InventoryPage';`) were created during legacy routing refactoring and are no longer needed since routes import directly from `src/pages/`.
2. **`CreateTicketModal.tsx` vs `CreateTicketPage.tsx`**:
   - `CreateTicketPage.tsx` is the active route component for `/tickets/new`. `CreateTicketModal.tsx` is an older modal version of ticket creation that is mostly duplicated.
3. **`ImportModal.tsx` vs `ImportCsvModal.tsx`**:
   - Two CSV import modal components exist with overlapping functionality.
4. **`PublicTrackingPage.tsx` vs `PublicCustomerTrackingPage.tsx`**:
   - `PublicCustomerTrackingPage.tsx` is the active route view for public tracking. `PublicTrackingPage.tsx` is a small 2.6 KB wrapper/legacy component.

---

## 13. Design Inconsistencies

1. **Theme Variants:**
   - Most pages use the clean light theme (`bg-[#f4f7fb]`, `bg-white`, `text-[#1e293b]`, `border-[#dfe5eb]`).
   - Minor dark theme inline remnants (`bg-[#101622]`, `bg-[#111827]`, `border-[#1f293d]`) still exist in older modal implementations.
2. **Border Color Tokens:**
   - Inconsistent use of Tailwind border tokens across components: `#dfe5eb`, `#e2e8f0`, `#cbd5e1`, `#1e2535`.
3. **Button Corner Radius:**
   - Primary action buttons inconsistently use `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), or `rounded-full`.
4. **Input Height Standard:**
   - Inputs vary between `h-10` (40px), `h-11` (44px), and `h-[46px]` (46px).

---

## 14. Recommended Component Architecture

```
src/
├── assets/
├── components/
│   ├── ui/                    # Base Unopinionated Design System Primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Dialog.tsx
│   │   ├── Drawer.tsx
│   │   ├── Badge.tsx
│   │   └── SearchInput.tsx
│   ├── common/                # Shared Feature Agnostic Components
│   │   ├── PageHeader.tsx
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   ├── KpiCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ConfirmationModal.tsx
│   ├── layout/                # Shell & Navigation
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── AppLayout.tsx
│   └── features/              # Domain-Specific Feature Components
│       ├── tickets/
│       ├── inventory/
│       ├── customers/
│       ├── staff/
│       ├── whatsapp/
│       └── reports/
├── hooks/                     # Custom React & React Query Hooks
├── lib/                       # API Services & Config
├── store/                     # Zustand Global State
├── utils/                     # Formatters, Validation, Constants
└── pages/                     # Clean Route Views
```

---

## 15. Refactoring Priority

| Priority | Pattern / Component | Estimated Effort | Risk | Expected Benefit |
|---|---|---|---|---|
| **P1 (High)** | Delete 24 unused re-export wrappers in `src/components/` | 30 mins | Very Low | Cleans repository structure & eliminates import confusion |
| **P1 (High)** | Extract `formatCurrency`, `formatDate`, `formatDateTime` to `src/utils/formatters.ts` | 1 hour | Very Low | Eliminates copy-pasted helper functions across 10+ files |
| **P2 (Medium)** | Create shared `<Pagination />` component | 2 hours | Low | Standardizes table navigation across all 7 data tables |
| **P2 (Medium)** | Standardize Input & Button Tailwind design tokens (`h-11`, `rounded-xl`, `#dfe5eb`) | 3 hours | Low | Enforces visual consistency across the entire application |
| **P3 (Low)** | Build unified `<DataTable />` component | 8 hours | Medium | Reduces code volume in `TicketsTable`, `CustomersTable`, `InventoryPage` |
| **P3 (Low)** | Consolidate `CreateTicketModal.tsx` into `CreateTicketPage.tsx` | 4 hours | Medium | Eliminates duplicate ticket intake form logic |

---

## 16. Top 10 Recommended Improvements

1. **Clean Up Dummy Re-export Wrappers:** Remove the 24 40-byte re-export files in `src/components/` that mirror pages in `src/pages/`.
2. **Centralize Utilities:** Move duplicated `money()`, `formatDate()`, and `formatTime()` functions into a dedicated `src/utils/formatters.ts` module.
3. **Create Shared Table Pagination:** Extract the duplicated bottom table pagination bar into a single reusable `<Pagination />` component.
4. **Standardize Input & Button Primitives:** Unify input height (`h-11`), corner radius (`rounded-xl`), and border tokens (`border-[#dfe5eb]`) in `src/components/ui/`.
5. **Unify Status Badges:** Consolidate ticket, invoice, inventory stock, and customer status badge logic into `StatusBadge.tsx`.
6. **Consolidate Duplicate CSV Import Modals:** Merge `ImportModal.tsx` and `ImportCsvModal.tsx` into a single configurable import dialog.
7. **Clean Up Legacy Duplicate Pages:** Deprecate `CreateTicketModal.tsx` in favor of `CreateTicketPage.tsx`, and `PublicTrackingPage.tsx` in favor of `PublicCustomerTrackingPage.tsx`.
8. **Centralize Query Keys:** Create a React Query key factory (`src/hooks/queryKeys.ts`) to avoid hardcoded query key arrays across mutation hooks.
9. **Standardize Page Header Usage:** Ensure all 27 pages use `PageHeader.tsx` rather than custom inline page title headers.
10. **Refactor Attachment API Service:** Refactor `src/services/attachment-api.ts` to use the primary `request` function from `src/lib/api.ts`.

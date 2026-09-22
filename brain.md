# CFS Admin UI — Project Knowledge & Architecture Guide (brain.md)

## 1. Project Overview

**CFS Admin UI** (`cfs-admin-ui`) is an enterprise-grade administrative single-page web application built with **Angular 21**. It provides comprehensive management capabilities for the Container Freight Station (CFS) and Yard/Asset Tracking ecosystem (Prosper Asset Tracking).

The application enables administrators and operators to manage client accounts, associated physical operational sites, user access roles, gate security/movement events, inventory, automated operational tasks, real-time alerts, and analytical reporting.

---

## 2. Technology Stack & Tooling

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Angular 21 (Standalone Components) | Strict mode, zoneless/RxJS reactive architecture |
| **Component Libraries** | Angular Material 21 & Angular CDK | Material 3 (M3) design theming |
| **CSS / Styling** | TailwindCSS 3.4.7 + Custom SCSS | PostCSS, Autoprefixer, custom M3 theme palettes |
| **Unit Testing** | Vitest 4.1 + AnalogJS Vite Plugin | `@analogjs/vite-plugin-angular`, JSDOM environment |
| **Build System** | Angular CLI 21 / ESBuild (`@esbuild/win32-x64`) | Optimized fast bundler |
| **Code Quality** | Prettier 3.9 + `prettier-plugin-tailwindcss` | Automated styling and formatting |
| **Language & Runtime** | TypeScript ~5.9.0 / Node.js 22+ LTS | Modern ECMAScript target |

---

## 3. Directory Structure

```
d:/cfs-admin-UI/cfs-UI/
├── angular.json                 # Angular workspace configuration
├── package.json                 # Dependencies and npm script targets
├── proxy.conf.json              # Dev server proxy routing to backend APIs
├── tailwind.config.js           # Tailwind theme and plugin configuration
├── tsconfig.json                # TypeScript project compiler configuration
├── vitest.config.ts             # Vitest test runner configuration
├── public/                      # Static assets served as-is
└── src/
    ├── main.ts                  # Application bootstrap entry point
    ├── index.html               # Main HTML shell
    ├── styles.scss              # Global style rules & Tailwind directives
    ├── m3-theme.scss            # Angular Material 3 custom theming
    ├── palettes.scss            # Brand color palettes
    ├── toastr.scss              # Toast notifications styling
    ├── icon-circle.scss         # Circular icon helper styles
    ├── environments/            # Environment configurations
    │   ├── environment.ts            # Development environment URLs
    │   └── environment.production.ts # Production environment URLs
    └── app/
        ├── app.component.ts     # Root Angular component
        ├── app.config.ts        # App-wide providers (HTTP, routing, animations)
        ├── app.routes.ts        # Top-level routing definitions & guards
        ├── core/                # Singleton services, interceptors, guards
        │   ├── auth/            # AuthService & AuthGuard
        │   ├── config/          # Application configuration loader
        │   ├── data/            # Core data stores and base states
        │   ├── guards/          # LoginGuard, MaintenanceGuard, RootGuard
        │   ├── http/            # Low-level HTTP utilities & token handlers
        │   ├── interceptors/    # ApiInterceptor (token injection), ExceptionInterceptor
        │   ├── maintenance/     # Maintenance mode display page & logic
        │   ├── models/          # Core cross-domain data contracts & interfaces
        │   └── services/        # Notification, session, and utility services
        ├── domain/              # Business models, state contracts, and domain types
        ├── layout/              # App Shell, header bar, sidebar, navigation
        │   └── shell/           # ShellComponent hosting router outlet & nav
        ├── shared/              # Shared reusable components, UI widgets, pipes
        │   ├── constants/       # AppRoutes and lookup constants
        │   └── ui/              # Common form inputs, modal dialogs, buttons
        └── features/            # Feature modules / domain workflows
            ├── auth / login     # Authentication and login screens
            ├── dashboard        # Metrics overview and operational summary
            ├── clients          # Client CRUD and management
            ├── sites            # Site CRUD tied to clients
            ├── users            # User CRUD (client, sites, and multi-role assignments)
            ├── roles            # Role and permission matrix management
            ├── gate-events      # Gate tracking, entry/exit operational events
            ├── tasks            # Scheduled tasks and operational jobs
            ├── inventory        # Inventory and asset tracking
            ├── reports          # Analytics and data report generators
            └── alerts           # System notifications and alert triggers
```

---

## 4. Modules & Route Map

All routes are defined in [`src/app/app.routes.ts`](file:///d:/cfs-admin-UI/cfs-UI/src/app/app.routes.ts) using lazy-loading standalone routes:

| Route Path | Feature Module | Guards / Protection | Description |
|---|---|---|---|
| `/login` | `features/auth/login` | `loginGuard` | User authentication & credential validation |
| `/maintenance` | `core/maintenance` | None | Service maintenance page |
| `/*` (Root Shell) | `layout/shell` | `maintenanceGuard`, `RootGuard` | Master layout wrapper with sidebar & header |
| `/dashboard` | `features/dashboard` | Inherited Shell Guards | Primary metrics and system health overview |
| `/clients` | `features/clients` | Inherited Shell Guards | Client organizations CRUD |
| `/sites` | `features/sites` | Inherited Shell Guards | Yard/CFS sites linked to parent clients |
| `/users` | `features/users` | Inherited Shell Guards | User administration (multi-site, multi-role) |
| `/roles` | `features/roles` | Inherited Shell Guards | Access control & permissions configuration |
| `/gate-events` | `features/gate-events` | Inherited Shell Guards | Inbound/outbound gate logistics & event audit |
| `/tasks` | `features/tasks` | Inherited Shell Guards | Task scheduler and workflow monitoring |
| `/inventory` | `features/inventory` | Inherited Shell Guards | Storage and inventory records |
| `/reports` | `features/reports` | Inherited Shell Guards | Business intelligence and operational reporting |
| `/alerts` | `features/alerts` | Inherited Shell Guards | Alert log, severity filtering, and notifications |

---

## 5. Backend & API Integration

### Development Proxy (`proxy.conf.json`)
For local development, API requests are proxied to avoid CORS issues:
- **Gate API (`/api/v1/gate`)** $\rightarrow$ `https://localhost:7248`
- **CFS Core Admin API (`/api`)** $\rightarrow$ `https://localhost:7190`

### Production Endpoints (`environment.production.ts`)
- **Core API Base URL**: `https://cfsapi.prosperassettracking.com/api`
- **Gate API Base URL**: `https://syapi.prosperassettracking.com/api/v1`

### Authentication & Interception
- Login is dispatched to `/api/auth/login` with `{ "UserName": "...", "Password": "..." }`.
- `ApiInterceptor` automatically attaches JWT bearer tokens to outbound requests and handles 401/403 authorization refreshes.
- `ExceptionInterceptor` intercepts and normalizes HTTP exceptions, providing toast notifications to users.

---

## 6. Development Workflow & Commands

| Action | Command | Purpose |
|---|---|---|
| **Start Dev Server** | `npm start` | Runs `ng serve --proxy-config proxy.conf.json` on `http://localhost:4200` |
| **Production Build** | `npm run build` | Compiles application into `dist/` using ESBuild |
| **Run Unit Tests** | `npm test` | Runs test suites with Vitest (`vitest run`) |
| **Watch Unit Tests** | `npm run test:watch` | Runs Vitest in continuous watch mode |
| **Code Formatting** | `npm run format` | Runs Prettier write over `src/**/*.{ts,html,scss,json}` |
| **Format Validation** | `npm run format:check` | Verifies code conforms to formatting standards |

---

## 7. Architectural Rules & Guidelines

1. **Standalone Components**: All new components must use Angular Standalone Components (`standalone: true` or default in v21).
2. **Reactivity**: Prefer Signals (`signal`, `computed`, `input`, `output`) and RxJS observables where event streams are involved.
3. **UI Reusability**: Common UI elements (inputs, date pickers, tables, action buttons) must reside in `src/app/shared/ui` to maintain design consistency.
4. **Security**: Client, site, and role access restrictions are visually guided by frontend guards (`RootGuard`, `AuthGuard`), but the backend APIs must always perform authoritative authorization checks.
5. **Dark Mode & Theming System**:
   - Class-based dark mode (`darkMode: 'class'` in `tailwind.config.js`).
   - Managed centrally by `ThemeService` (`src/app/core/services/theme.service.ts`), toggling `.dark` and `[data-mode="dark"]` on `document.documentElement` with local storage persistence and system preference fallback.
   - Main layout uses a clean minimalist light enterprise background (`#f8fafc` / `bg-slate-50`) in light mode and deep minimalist navy (`#070c18`) in dark mode.
   - Sidebar features minimalist dark navy styling (`#00172e` in light mode, `#050b14` in dark mode) with solid blue active pills.
   - Custom palette tokens defined in `tailwind.config.js`: `'gray-850'` (`#111a2d`), `'gray-750'` (`#1e293b`), and `'slate-850'` (`#111a2d`).
   - Native widgets use `color-scheme: dark;` on `html.dark` to ensure datepicker calendars, select popovers, and scrollbars render in dark mode.

---

## 8. Universal Design System & Styling Standards (Sarveshwar CFS Enterprise Design System)

All modules across the application adhere to the unified visual design language:

| Design Element | Light Mode Format | Dark Mode Format | Specifications |
|---|---|---|---|
| **Branding** | **SARVESHWAR CFS** (Container Freight Station) | Same | 40x40 rounded-xl logo container with `#2563EB` background and white SVG icon |
| **Main Layout** | Minimalist solid `bg-slate-50` (`#F8FAFC`) | Minimalist deep navy `bg-[#070c18]` | Clean enterprise background, high visual comfort for full-day operational usage |
| **Sidebar Navigation** | Enterprise dark slate `#0F172A` (slate-900) | Deep dark navy `#090e17` | 240px fixed width, active item blue-tinted (`rgba(37, 99, 235, 0.16)`) with `3px solid #2563EB` indicator, collapsible to 72px icon rail |
| **Top Navigation Bar** | Solid `bg-white`, border `#E2E8F0` | Solid `bg-[#0b1120]`, border `rgba(59, 130, 246, 0.18)` | 64px height, sticky, context dropdown pills, search box, theme toggle, notifications, profile |
| **Dashboard Bento Cards** | Bento Grid: Solid `bg-white`, border `#E2E8F0`, shadow-sm | Bento Grid: Solid `bg-[#111a2e]`, border `rgba(255, 255, 255, 0.08)` | 12px rounded-xl, soft shadow, high-contrast KPI numbers, trend indicators |
| **Primary Buttons** | Solid `#2563EB` (blue-600), hover `#1D4ED8` | Solid `#2563EB`, hover `#1D4ED8` | 8px radius (`rounded-lg`), white text, 600 weight, accessible focus ring |
| **Secondary Buttons** | Solid `#FFFFFF`, border `#CBD5E1`, text `#1E293B` | Solid `#111a2d`, border `rgba(59, 130, 246, 0.25)` | 8px radius (`rounded-lg`), hover highlight `#F8FAFC` |
| **Operational Status Badges** | Rounded-full pills with subtle dot | Same semantics with dark containers | **Success**: `bg-green-100 text-green-800 border-green-200`<br>**Pending**: `bg-amber-100 text-amber-800 border-amber-200`<br>**Error**: `bg-red-100 text-red-800 border-red-200`<br>**Processing**: `bg-blue-100 text-blue-800 border-blue-200`<br>**Inactive**: `bg-slate-100 text-slate-600 border-slate-200` |
| **Data Tables** | Clean solid `bg-white`, header `bg-slate-50` (`#F8FAFC`) | Clean solid `bg-[#111a2e]`, header `bg-[#0F172A]` | 100% solid surface, 11.5px uppercase bold header, 13px body text, subtle borders `#E2E8F0` |
| **Filter & Search Inputs** | Solid `bg-white`, border `#CBD5E1` | Solid `bg-[#111a2d]`, border `rgba(59, 130, 246, 0.25)` | 38px height, 8px radius, Inter font, blue-600 focus ring |
| **Typography** | `Inter` (sans-serif fallback) across all headings, body, labels | Same | Loaded via Google Fonts (`wght@300;400;500;600;700;800`), font scale standardized in Tailwind |
| **Login Page** | Preserved authentication design | Same | Completely untouched as required |



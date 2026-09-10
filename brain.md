# CFS Admin UI — System Architecture & Knowledge Base (`brain.md`)

> **Single Source of Truth** for the Container Freight Station (CFS) Enterprise Management Console.
> Built on **Angular 21 (Standalone)**, **TypeScript 5.9**, **TailwindCSS 3.4**, and **Material Design 3**.

---

## 1. Executive Summary & Domain Scope

The **CFS Admin UI** is an enterprise-grade administrative portal engineered for **Container Freight Stations (CFS)**, inland container depots, and maritime terminal operators. It facilitates operational oversight, access governance, optical gate automation, and organization hierarchy management.

### Key Domain Capabilities
- **Multi-Tenant Organization Hierarchy**: Top-level Client organizations mapped to physical terminal Sites and logistics yards.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions scoped across Client vs. Site levels, with multi-site role mapping per user.
- **Optical Gate Automation (GateVision OCR)**: Real-time container gate transactions (IN/OUT), 4-angle camera inspection (Front OCR, Left ISO, Right ISO, Rear Doors), AI damage anomaly detection, and release approval workflows.
- **Terminal Operations Dashboard**: Operational metrics, facility health monitoring, live yard sensor synchronization, and quick-access administrative hubs.
- **Enterprise Context Switching**: Seamless switching between active Client and Site operational contexts, updating backend JWT claims and filtering data dynamically.

---

## 2. Technical Stack & Build Matrix

| Layer | Technology / Package | Version / Configuration |
| :--- | :--- | :--- |
| **Framework** | Angular (Standalone Components) | `^21.0.0` |
| **Language** | TypeScript | `~5.9.0` (Target: `ES2022`, Strict Mode) |
| **Styling Engine** | Tailwind CSS | `^3.4.7` (`darkMode: 'class'`, `important: true`) |
| **Design System** | Angular Material + M3 SCSS Theme | `^21.0.0` (Custom CSS variables & palettes) |
| **Typography** | Lexend Font Family | Google Fonts (`Lexend`, sans-serif) |
| **Reactivity** | Angular Signals & RxJS | Signals (`signal`, `computed`, `effect`) + RxJS `~7.8.1` |
| **Testing** | Vitest + AnalogJS Vite Plugin | `vitest ^4.1.11`, `jsdom ^29.1.1` |
| **Formatting** | Prettier + Tailwind Plugin | `prettier ^3.9.6`, `prettier-plugin-tailwindcss ^0.8.1` |
| **Runtime / Node** | Node.js | `>= 22 LTS` |
| **Backend Target** | ASP.NET Core Web API | `https://localhost:7190/api` (Local Dev Proxy) |

---

## 3. Directory Architecture

```
d:/cfs-admin-ui-angular21/
├── proxy.conf.json             # Dev reverse proxy: /api -> https://localhost:7190
├── tailwind.config.js          # Custom breakpoints, typography scale, class dark mode
├── tsconfig.json               # Path mappings: app/*, core/*, shared/*, environment/*
├── vitest.config.ts            # Vitest unit test runner config with @analogjs/vite-plugin
├── src/
│   ├── index.html              # App entrypoint with Google Fonts (Lexend) & Material icons
│   ├── main.ts                 # Bootstrap standalone application with appConfig
│   ├── m3-theme.scss           # Material Design 3 theme definitions & CSS custom properties
│   ├── palettes.scss           # Primary, secondary, tertiary & neutral color palettes
│   ├── styles.scss             # Global stylesheet, Tailwind imports & custom scrollbars
│   ├── variables.scss          # SCSS breakpoint variables mirroring Tailwind
│   ├── version.json            # Build metadata, timestamp & app version
│   ├── assets/
│   │   └── i18n/               # Multilingual translation dictionaries (en.json, es.json, fr.json)
│   ├── environments/
│   │   ├── environment.ts      # Dev config (apiBaseUrl: https://localhost:7190/api)
│   │   └── environment.production.ts
│   └── app/
│       ├── app.config.ts       # Router, HttpClient with functional interceptors, Animations
│       ├── app.routes.ts       # Root route hierarchy with lazy-loaded features & guards
│       ├── layout/
│       │   └── shell/          # App shell: responsive sidebar, top navbar, context switcher
│       ├── core/
│       │   ├── auth/           # AuthService (signals, JWT decode, context switch, roles)
│       │   ├── data/           # AdminRepository (signals store, seed fallback, REST CRUD)
│       │   ├── guards/         # RootGuard (auth), loginGuard (guest), maintenanceGuard
│       │   ├── http/           # HTTP helpers & utilities
│       │   ├── interceptors/   # apiInterceptor (Bearer token, Site-ID header, 401 handler)
│       │   ├── maintenance/    # Standalone maintenance page component
│       │   ├── models/         # Core data interfaces (Client, Site, User, Role)
│       │   └── services/       # ApiUrlService, LocalizationService, NavigationService, ThemeService
│       ├── features/
│       │   ├── auth/login/     # Standalone login view with credential validation
│       │   ├── dashboard/      # KPI metrics, terminal automation status, module hub
│       │   ├── clients/        # Client organizations list, filter, CRUD & status modals
│       │   ├── sites/          # CFS yard sites linked to clients, site codes, city info
│       │   ├── users/          # User administration, multi-site role mapping, password reset
│       │   └── gate-events/    # Live optical OCR gate feed & table view
│       │       └── gate-event-detail/ # Standalone record detail view component (UI reference)
│       └── shared/
│           ├── components/     # Atomic design component library
│           │   ├── atoms/      # Avatar, Button, CenteredDivider, ConfidenceBadge, StatusBadge
│           │   ├── molecules/  # FormField, GatePhotoStrip, Modal
│           │   └── organisms/  # PageHeader (breadcrumbs, dynamic title, action buttons)
│           ├── constants/      # AppRoutes enum & system constants
│           ├── directives/     # 8 custom directives for forms, roles, formatting & UX
│           ├── enums/          # StatusEnum
│           ├── pipes/          # TranslatePipe
│           ├── services/       # BaseApiService, FormFocusInvalidFieldService
│           └── types/          # Admin entity types & interfaces
```

---

## 4. Authentication, Authorization & Context Management

### Authentication Architecture (`AuthService`)
The authentication system is signal-driven and stores credentials in browser `sessionStorage`:
- `cfs_admin_token`: JWT access token sent in HTTP `Authorization: Bearer <token>` header.
- `cfs_admin_refresh_token`: Refresh token stored for session renewal.
- `cfs_selected_client_id`: Selected active client context UUID.
- `cfs_selected_site_id`: Selected active site context UUID.

#### Key Signals & Computeds in `AuthService`:
```typescript
authenticated: Signal<boolean>          // Tracks active session state
userClaims: Signal<any>                 // Decoded JWT payload claims
selectedClientId: Signal<string>        // Active Client ID context
selectedSiteId: Signal<string>          // Active Site ID context
isSystemAdmin: Computed<boolean>        // True if claims contain role 'SystemAdmin'
tokenClients: Computed<ContextClient[]> // Available clients parsed from JWT claims
userName: Computed<string>              // Formatted user display name
userInitials: Computed<string>          // 2-character user initials for avatars
sessionExpired: Signal<boolean>         // Triggers re-auth/session expired modal
```

### Context Switching (`switchContext`)
When an operator switches the active Client or Site via the header dropdowns:
1. Calls `POST /api/auth/context` with `{ ClientId, SiteId }`.
2. Backend returns a freshly signed JWT token encoded with the updated scope and permissions.
3. `AuthService` updates `sessionStorage`, updates `userClaims`, and sets `selectedClientId` / `selectedSiteId`.
4. `ShellComponent` triggers `AdminRepository.loadAll()`, instantly refreshing all cached data to reflect the new tenant/facility.

### Role-Based Access Control (RBAC)
- **Superuser**: `SystemAdmin` bypasses all permission checks automatically.
- **Levels**: Roles are categorized into `Client` (enterprise/billing/org-wide) and `Site` (yard/gate/surveyor/operations).
- **Template Directive**: `*appUserRolesAccess` conditionally renders DOM elements:
  ```html
  <!-- Simple string or array -->
  <button *appUserRolesAccess="['SystemAdmin', 'Yard Supervisor']">Dispatch Reach-Stacker</button>

  <!-- Boolean logic -->
  <div *appUserRolesAccess="{ any: ['Gate Operator'], not: ['Surveyor'] }">...</div>
  ```

### Bypass Login / Local Development Mode (`bypassLogin`)
To accelerate local development, UI debugging, and offline demonstrations without requiring an active ASP.NET Core backend instance on port 7190:
- **Auto-Bypass in `RootGuard` & Constructor**: When launching the application or directly navigating to protected routes (e.g. `/`, `/clients`, `/dashboard`), `RootGuard` automatically calls `AuthService.bypassLogin()` if the session is unauthenticated.
- **Mock Token Injection**: Generates a valid Base64-encoded mock JWT with `SystemAdmin` authority, far-future expiration (`exp: 253402300799`), and primary client context (`c-1` / `s-1`).
- **Graceful Fallback on Login Failure**: If the backend API `/api/auth/login` fails or is unreachable, the login form automatically falls back to `bypassLogin()`.
- **Direct Login Bypass Button**: An interactive `⚡ Bypass Login (Instant Dev Access)` action button is embedded directly on the login screen.
- **Session Expiration Guard**: `isBypassMode()` suppresses session timeout/401 alerts while mock tokens are active.

---

## 5. State Management & Data Architecture (`AdminRepository`)

State is managed via Angular **Signals** in `AdminRepository` (`src/app/core/data/admin.repository.ts`), providing deterministic reactivity with zero boilerplate:

### Reactive Signals
- `clients = signal<Client[]>(SEED_CLIENTS)`
- `sites = signal<Site[]>(SEED_SITES)`
- `roles = signal<Role[]>(SEED_ROLES)`
- `users = signal<User[]>(SEED_USERS)`
- `loading = signal<boolean>(false)`
- `error = signal<string>('')`

### Robust Offline / Development Fallback Pattern
To guarantee full functionality during development, automated tests, or backend downtime:
- All repository methods (`listClients`, `listSites`, `listRoles`, `listUsers`) make live HTTP calls to `/api/...`.
- If the backend returns `404`, `500`, or network connection fails, `AdminRepository` catches the error and falls back to rich built-in **Seed Data** (`Sarweshwar CFS Nhava Sheva`, `JNPT Maritime Logistics`, `APM Terminals Gateway`, associated yard sites, and operator accounts).
- Create, Update, and Delete operations perform optimistic state updates in the signals so the UI updates immediately.

### Envelope Unwrapping
The repository automatically normalizes varied API response structures:
`response.data ?? response.items ?? response.value ?? response.result ?? response`.

---

## 6. HTTP Pipeline & Interceptors

All outbound HTTP calls configure through `app.config.ts`:

```typescript
provideHttpClient(withInterceptors([apiInterceptor, exceptionInterceptor]))
```

### 1. `apiInterceptor` (`src/app/core/interceptors/api.interceptor.ts`)
- **JWT Injection**: Attaches `Authorization: Bearer <token>` to all protected endpoints.
- **Multi-Tenancy Header**: Attaches `Site-ID: <activeSiteId>` to allow server-side facility scoping.
- **Token Expiration Check**: Inspects `claims.exp` before requests; triggers `sessionExpired` modal if expired.
- **401 Response Interception**: Catches unauthorized responses and invokes `auth.triggerSessionExpired()`.

### 2. `exceptionInterceptor` (`src/app/core/interceptors/exception-interceptor.ts`)
- Global error tap and centralized logging hook for unhandled exceptions.

---

## 7. UI Design System & Styling Guidelines

### Tailwind CSS Configuration (`tailwind.config.js`)
- `darkMode: 'class'`: Toggled dynamically by `ThemeService` adding/removing the `.dark` class on `document.documentElement`.
- `important: true`: Ensures utility classes override Material component defaults without inline styles.
- **Strict Custom Breakpoints**:
  - `sm`: `640px` (Mobile handheld)
  - `md`: `800px` (Tablet / iPad portrait — *Note: Not default 768px*)
  - `lg`: `1370px` (Desktop / Dual monitors — *Note: Not default 1024px*)
- **Strict Font Scale**:
  - `xs: 10px`, `sm: 12px`, `md: 14px`, `base: 16px`, `xl: 1.25rem`, `2xl: 1.563rem`, `3xl: 1.953rem`, `4xl: 2.441rem`, `5xl: 3.052rem`.
- **Component Sizing Standard**: `w-140` (`140px`) used for standard action buttons and metric pills.

### Theme Engine (`ThemeService`)
- Persists theme in `localStorage.getItem('cfs_theme_mode')`.
- Detects system preference `(prefers-color-scheme: dark)`.
- Updates `document.documentElement` attributes `data-mode="dark"` and class `dark`.

---

## 8. Internationalization (i18n) Engine

The application features a custom, zero-dependency localization architecture:
- **Service**: `LocalizationService` (`src/app/core/services/localization.service.ts`).
- **Supported Languages**: `en` (English), `es` (Spanish), `fr` (French).
- **Storage**: Translations located in `src/assets/i18n/{lang}.json`.
- **In-Memory Fallback**: Built-in `DEFAULT_TRANSLATIONS` prevents blank UI during initial load.
- **Pipe**: `TranslatePipe` (`src/app/shared/pipes/translate.pipe.ts`):
  ```html
  <h1>{{ 'GATE_EVENTS.TITLE' | translate }}</h1>
  <p>{{ 'AUTH.LOGIN_SUBTITLE' | translate }}</p>
  ```
- **Language Switcher**: Directly available in the top navbar and responsive drawer.

---

## 9. Shared Component Library (Atomic Design)

### Atoms (`shared/components/atoms/`)
- **`app-avatar`**: Generates colored initials avatar or user photo with online badge.
- **`app-button`**: Reusable button with variants (`primary`, `secondary`, `danger`, `text`), loading spinner, and icon support.
- **`app-status-badge`**: Status indicator pill with glowing pulse dot (`Active` vs `Inactive`).
- **`app-confidence-badge`**: Visual OCR accuracy indicator with segmented signal bars (`high >= 95%`, `med >= 90%`, `low < 90%`).
- **`app-centered-divider`**: Styled horizontal rule with centered separator text.
- **`app-icon-circle`**: Circular icon wrapper with themed backgrounds.

### Molecules (`shared/components/molecules/`)
- **`app-form-field`**: Complete reactive form control integration supporting `text`, `email`, `password`, `select`, `multiselect`, `textarea`, hint text, prefix icons, and automatic touched/dirty error validation messages.
- **`app-gate-photo-strip`**: Camera thumbnail gallery displaying 4-angle terminal container captures with color-coded carrier tags and click-to-inspect events.
- **`app-modal`**: Dialog container with header, subtitle, icon, size variants (`sm`, `md`, `lg`, `xl`, `2xl`), animated entrance, and backdrop dismissal.

### Organisms (`shared/components/organisms/`)
- **`app-page-header`**: Standardized page title header with interactive breadcrumb hierarchy, subtitle, and primary call-to-action button.

---

## 10. Custom Directives Library

Located in `src/app/shared/directives/`:

1. **`appDuplicateName`**: Form validator directive checking client-side uniqueness before submission.
2. **`appElapsedTime`**: Real-time timer badge calculating elapsed minutes/hours since an event timestamp.
3. **`appFocusInvalidField`**: Automatically scrolls to and focuses the first invalid form control when a form is submitted.
4. **`appHighlightText`**: Highlights matching search query substrings within text labels or table columns.
5. **`appPhoneFormat`**: Masks and auto-formats telephone input into standard telephone mask `+91 XXXXX XXXXX`.
6. **`appTouchedOnKeyUp`**: Marks form controls as touched on keyup events for instant validation feedback.
7. **`appUppercase`**: Enforces uppercase text transform on container numbers, ISO codes, and truck plates.
8. **`appUserRolesAccess`**: Structural directive providing RBAC visibility control (`any`, `all`, `not`).

---

## 11. Feature Modules Breakdown

### 1. Authentication (`features/auth/login`)
- Clean, responsive split-screen login layout with brand imagery and secure authentication.
- Full credential validation with field error indicators.
- Injects JWT access & refresh tokens on successful response, then routes to `/dashboard`.

### 2. Dashboard (`features/dashboard`)
- Real-time KPI cards: Total Clients, Total Sites, Active Users, System Health.
- Live Terminal Automation Health feed (GateVision OCR accuracy, RTK Yard Map sync, Backend API status).
- Quick navigation hub for system administration.

### 3. Clients Management (`features/clients`)
- Complete enterprise organization management.
- Live search query filter, active/inactive status tabs.
- Create / Edit client modal with validation.
- Status activation/deactivation confirmation dialog.

### 4. Sites Management (`features/sites`)
- Physical terminal sites associated with client organizations.
- Site code (`DNY-A`, `JMT-04`), facility name, city, and status management.
- Client filter dropdown and search bar.

### 5. Users Management (`features/users`)
- Comprehensive staff management with per-site role assignments.
- Search by user name, email, or role with term highlighting.
- Modal supporting multi-site selection and role assignment matrix (`Yard Supervisor`, `Gate Operator`, `CFS Surveyor`, etc.).
- Password reset and phone formatting integration.

### 6. Roles Management (`features/roles`)
- RBAC role definitions with scope assignment (`Client` vs `Site` level).
- Modal creation with role description and administrative privileges.

### 7. Gate Events (`features/gate-events`)
- **Visual Presentation**:
  - Exact 1:1 match to Prosper CFS reference layout (`media_1789036712459.png`).
  - Top summary cards: `Today's Arrivals` (28), `Today's Departures` (22), `OCR Verified` (76), `Pending Review` (12), `Damaged Captures` (5).
  - Filter bar: Direction (`All`, `IN`, `OUT`), Gate (`All Gates`, `GATE-01`, `GATE-02`, `GATE-03`), Date (`17 May 2025`), OCR Confidence (`All`, `High`, `Medium`, `Low`), and Search with Clear + `Filters` funnel button.
  - Toolbar row: Segmented pill tabs (`All (50)`, `Arrivals (28)`, `Departures (22)`) on the left; Action buttons (`Approve`, `Reprocess OCR`, `Export`) on the right. Note: "View Details" button removed from the toolbar.
  - Interactive table: Clicking any row navigates directly to the comprehensive detail screen. Monospace container & truck plates, live OCR text, 3-tier signal bars confidence rating, status & damage pills, and 4 container thumbnail previews.
  - Pagination footer: Event counter, active blue pill page numbers, next arrow, and 10/25/50 per page selector.
- **Standalone Detail Component (`features/gate-events/gate-event-detail`)**:
  - Extracted as a separate, highly responsive standalone component (`GateEventDetailComponent`).
  - Inputs: `event: GateEventItem` (required signal input).
  - Outputs: `back`, `approve`, `markException`, `reRunOcr`, `createTask`, `toast`.
  - Features: Breadcrumb nav, 2x2 CCTV angles with click-to-zoom Lightbox, OCR extracted details with 4-column aligned grid (`160px 1fr 65px 85px`), Event Information with fixed-column labels (`160px`) and telephone SVG badge, Additional Checks visually demarcated via vertical border divider (`border-left: 1px solid #edf2f7`) with circular green checkmark verification badges, 4-step interactive timeline stepper with check dots, system notes, and 4 styled bottom action buttons (`Re-run OCR`, `Mark Exception`, `Create Task`, `Approve`).
  - Responsive across Mobile (< 640px), Tablet (641px - 1024px), and Desktop (> 1024px).

---

## 12. Routing & Navigation Matrix

```
/login                     -> LoginComponent (canActivate: [loginGuard])
/maintenance               -> MaintenanceComponent
/ (ShellComponent)         -> canActivate: [maintenanceGuard, RootGuard]
  ├── /dashboard           -> DashboardComponent
  ├── /clients             -> ClientsComponent
  ├── /sites               -> SitesComponent
  ├── /users               -> UsersComponent
  ├── /roles               -> RolesComponent
  └── /gate-events         -> GateEventsComponent
/**                        -> Redirects to /
```

---

## 13. Developer Commands & Quality Scripts

```bash
# Start development server with proxy config (target: https://localhost:7190)
npm start

# Run unit tests via Vitest
npm test

# Run tests in watch mode
npm run test:watch

# Build production bundle
npm run build

# Format entire codebase (Prettier + Tailwind plugin)
npm run format

# Verify formatting without modifying files
npm run format:check

```

---
## 14. Architecture Principles & Extension Rules

When developing new features or refactoring existing code in this repository:
1. **Always use Standalone Components**: Do not introduce NgModules. Use standalone components, directives, and pipes.
2. **Embrace Angular Signals**: Use `signal()`, `computed()`, and `effect()` for local and shared state. Prefer signals over `BehaviorSubject` where possible.
3. **Preserve Atomic Design**:
   - Small primitives go into `shared/components/atoms`.
   - Combined controls go into `shared/components/molecules`.
   - Composite headers/widgets go into `shared/components/organisms`.
4. **Enforce Accessibility & UX**:
   - Use `appFocusInvalidField` on forms.
   - Use `appHighlightText` on search result tables.
   - All interactive elements must support keyboard navigation and clear hover/focus rings.
5. **Always Update Localization**:
   - When adding text, add the corresponding keys in `src/assets/i18n/en.json`, `es.json`, and `fr.json`.
   - Update `DEFAULT_TRANSLATIONS` in `LocalizationService` if adding critical navigation or common keys.
6. **Maintain Offline Fallback**:
   - If adding a new resource to `AdminRepository`, ensure it has a seed fallback array so UI features can be tested offline or without a running backend.

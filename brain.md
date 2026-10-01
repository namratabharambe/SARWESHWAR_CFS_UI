# CFS (Container Freight Station) Development Project - Brain Knowledge Base

## 1. Project Overview
**CFS Development** is an enterprise-grade Web Application for Container Freight Station (CFS) Management and Yard Operations. It facilitates end-to-end container tracking, automated gate operations (OCR camera feeds, Gate-In, Gate-Out), yard planning and container inventory management, billing, maintenance, and role-based access control.

---

## 2. Technology Stack
- **Framework**: Angular 21 (Standalone Components, Signals API, OnPush Change Detection)
- **Language**: TypeScript ~5.9.0
- **Build & Test**: Vite / Vitest, Angular CLI (`@angular-devkit/build-angular`)
- **Styling**: Tailwind CSS 3.4.7 with custom design system tokens, PostCSS, SCSS
- **State Management**: Angular Signals (`signal`, `computed`, `effect`)
- **Map & Spatial Visualization**: Leaflet 1.9.4 for Yard Map and Geofencing (`Geofences.csv`)
- **Icons & UI Utilities**: Material Icons / Material Symbols Outlined, Angular CDK, Angular Material
- **Internationalization**: Custom localization service (`LocalizationService`, `TranslatePipe`) supporting English, Spanish, French

---

## 3. Architecture & Project Layout

```
CFS_Development/
├── proxy.conf.json                   # Reverse proxy configuration for Gate and CFS APIs
├── angular.json                      # Angular workspace configuration
├── tailwind.config.js                # Tailwind tokens, color palette, animations
├── src/
│   ├── app/
│   │   ├── app.config.ts             # Application providers (HttpClient, Interceptors, Router)
│   │   ├── app.routes.ts             # Top-level routing
│   │   ├── core/                     # Core singleton services and infrastructure
│   │   │   ├── auth/                 # Authentication, JWT token storage, user session
│   │   │   ├── interceptors/         # api.interceptor.ts, exception.interceptor.ts
│   │   │   ├── services/             # localization.service.ts, api.url.service.ts
│   │   │   └── guards/               # Route protection guards
│   │   ├── features/                 # Domain feature modules
│   │   │   ├── dashboard/            # Executive overview, KPI cards, container journey
│   │   │   ├── inventory/            # Container inventory management, analytics, tables
│   │   │   ├── gate-events/          # Gate In/Out camera OCR, manual entry, visits
│   │   │   ├── yard-map/             # Leaflet-based interactive 2D yard map
│   │   │   ├── users/                # User management & administration
│   │   │   ├── billing/              # Invoices, tariffs, charges
│   │   │   └── reports/              # Yard utilization and dwell-time reports
│   │   ├── layout/                   # App shell, navigation sidebar, header
│   │   └── shared/                   # Shared components, models, and services
│   │       ├── components/           # Dropdowns, modal dialogs, date pickers, badges
│   │       ├── services/             # gate-event.service.ts, inventory.service.ts, etc.
│   │       ├── types/                # TypeScript interfaces (inventory, gate-event, etc.)
│   │       └── pipes/                # translate.pipe.ts
│   ├── assets/                       # i18n JSON translations, static icons & sample images
│   └── environments/                 # environment.ts & environment.production.ts
```

---

## 4. API Endpoints & Proxies
Defined in `proxy.conf.json`:
- `/api/v1`: Proxied to Gate Event Backend (`https://syapi.prosperassettracking.com`)
  - `GET /api/v1/gate/visits?page=1&pageSize=25&eventType=GATE_IN`
  - `GET /api/v1/gate/visits?page=1&pageSize=25&eventType=GATE_OUT`
  - `GET /api/v1/gate/visits/{visitId}`
  - `POST /api/v1/gate/events` (Capture camera/manual gate event)
- `/api`: Proxied to CFS Main Backend (`https://cfsapi.prosperassettracking.com`)
  - Authentication, Clients, Sites, Roles, Users

---

## 5. Key Feature Modules

### 5.1 Inventory (`src/app/features/inventory`)
- **KPI Metrics**: Total Containers, Import, Export, Empty, Overstay (>7 Days).
- **Analytics Widgets**:
  - *Inventory by Type*: Donut visualizer displaying Export, Import, and Empty container distributions.
  - *Location Utilization*: Yard vs Gate occupancy and capacity metrics.
- **Controls & Filters**:
  - Gate In and Gate Out mode toggle buttons fetching live container visit events.
- **List / Table View**:
  - Displays Container No, Size/Type, Full/Empty status, Location ("In Yard"), Last Action, Arrival Date/Last Updated, and dynamically calculated Days in Yard.
  - Drawer and move modals for container lifecycle management.

### 5.2 Gate Events (`src/app/features/gate-events`)
- Live OCR camera recognition for license plates, truck registration, container stencils, and ISO codes.
- Gate In and Gate Out verification workflows, manual gate entry fallback, and non-ERP container handling.

### 5.3 Yard Map (`src/app/features/yard-map`)
- Interactive Leaflet map displaying yard blocks (A–F), bays, rows, stacks, and geofenced zones.

---

## 6. Design System & Theming
- Primary Navy: `#0f2851`
- Accent Indigo: `#525EA7`
- Backgrounds: Neutral slate tints `#f8fafc`, dark mode `#111a2e`
- Responsive typography with bold hierarchy, font-mono for container identifiers, and soft rounded borders (`rounded-xl`, `rounded-[14px]`).

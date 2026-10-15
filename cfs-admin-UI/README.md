# CFS Admin UI — Angular 21

Reusable standalone Angular 21 admin application based on the supplied UI design.

## Modules

- JWT-ready admin login
- Blank dashboard with sidebar navigation
- Client CRUD
- Site CRUD linked to a client
- User CRUD with client, multiple sites, and multiple roles
- Role CRUD with client/site scope

## Run

1. Install Node.js 22 LTS or newer.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:4200`.

Login calls `POST https://localhost:7190/api/auth/login` through the Angular development proxy with `{ "UserName": "...", "Password": "..." }`.

## Backend integration

The API repository binds Clients, Sites, Roles and Users to `/api/clients`, `/api/sites`, `/api/roles` and `/api/users`. Shared fields and buttons are located under `src/app/shared/ui` and reused by all forms. The JWT interceptor is isolated in `core/http`.

The API must enforce all client, site, and role permissions server-side. UI guards improve navigation but are not a security boundary.

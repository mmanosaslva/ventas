# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Sales registration app (UI and messages in Spanish). Next.js 14 App Router + TypeScript + Tailwind, Prisma 5 on PostgreSQL, NextAuth (credentials, JWT sessions). Intended for Vercel deploy. Requirements spec lives in [registro_ventas.md](registro_ventas.md).

## Commands

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` (next lint)
- `npx prisma db push` (or `migrate dev`) after editing [prisma/schema.prisma](prisma/schema.prisma); `prisma generate` runs automatically on `postinstall`
- `npx prisma db seed` — runs [prisma/seed.ts](prisma/seed.ts) via ts-node; seeds/syncs the admin user (password re-synced on each run)
- No test suite configured.

Requires `DATABASE_URL` (Postgres) and NextAuth env vars (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`) in a local `.env` (not committed).

## Architecture

- `src/app/*` pages are client-facing screens: `/` (dashboard/report), `/login`, `/productos`, `/combos`, `/ventas`, `/ventas/nueva`, `/admin`. Path alias `@/` → `src/`.
- `src/app/api/*` route handlers: `ventas`, `productos`, `admin/users` (each with `[id]` for item ops), plus NextAuth at `api/auth/[...nextauth]`.
- Auth: [src/lib/auth.ts](src/lib/auth.ts) defines `authOptions` (credentials + bcrypt; `id` and `role` copied into JWT and session; types augmented in [src/types/next-auth.d.ts](src/types/next-auth.d.ts)). Route handlers call `getServerSession(authOptions)` themselves and check `session.user.role`.
- [src/middleware.ts](src/middleware.ts) only guards pages (`/ventas`, `/productos`, `/combos`, `/admin`; `/admin` requires role `admin`). API routes are NOT covered by the matcher — every handler must do its own auth check.
- Data scoping: `Sale` belongs to a `User`; non-admins only see their own sales, admins see all (see [src/app/api/ventas/route.ts](src/app/api/ventas/route.ts)). `Product` is a global list (unique name, optional price).
- `Sale.saleAmount` is the total (price × quantity, computed client-side in the new-sale form and still editable); `productName` is a plain string, not a FK to `Product`.
- Combos: `Combo` + `ComboItem` (product, quantity), min 2 total units (same product may repeat via quantity, e.g. a duo). `Combo.price` is a user-editable estimate; default = sum(product price × qty), computed in the UI and as server fallback in [src/lib/combos.ts](src/lib/combos.ts). Products in a combo can't be deleted (409). 
- UI kit in `src/components/`: [icons.tsx](src/components/icons.tsx) (inline SVG, no icon lib), [Select.tsx](src/components/Select.tsx) (custom dropdown, supports option groups — native `<select>` is not used because it can't be themed), [Field.tsx](src/components/Field.tsx) (`Field`, `PasswordField` with show/hide, `MoneyField`, `SearchField`). Shared classes (`page-title`, `page-container`, `chip`, `icon-btn`, `input-field`, `card`) live in [globals.css](src/app/globals.css). Lists render a table on desktop and a card list on mobile (mobile-first).
- New-sale form uses one dropdown for products and combos (values `p:<id>`, `c:<id>`, `__new__`); a combo sale stores the combo name in `Sale.productName` and `Sale.comboId`; out-of-stock options are disabled.
- Inventory: `Product.stock` is nullable (null = not tracked, so legacy products keep selling). `Sale` stores `productId`/`comboId` (null on legacy sales) so stock can be moved precisely; all stock changes go through [src/lib/inventory.ts](src/lib/inventory.ts) inside a Prisma transaction: create sale → consume, edit → restore old + consume new, delete → restore. Insufficient stock throws `StockError` → API 409 and the transaction rolls back. A combo sale consumes each `ComboItem` × quantity (using the combo's *current* items). Linked sales can't change `productName` on edit. `LOW_STOCK` lives in [src/lib/inventory-shared.ts](src/lib/inventory-shared.ts) so client code doesn't import `@prisma/client`.
- Prisma client singleton in [src/lib/db.ts](src/lib/db.ts).
- `.claude/skills` is gitignored; `.cursor/` and `.devin/` hold a prisma-composer skill.

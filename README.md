# Laptop Shop

A full-stack e-commerce web application for a laptop store, built with **Express 5**, **TypeScript**, **Prisma ORM**, and **EJS** templates. Features a public storefront, shopping cart, order management, and a role-protected admin panel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM, `"type": "module"`) |
| Framework | Express 5 |
| Language | TypeScript (strict mode, NodeNext resolution) |
| ORM | Prisma 6 |
| Database | MySQL |
| Auth | Passport.js (LocalStrategy) + express-session |
| Views | EJS with partials |
| File uploads | Multer |
| Validation | Zod |
| Dev server | tsx (watch mode) |

---

## Features

### Storefront (public / auth-required)
- Product listing with search, sort (price, name), brand filter, price range filter, and pagination
- Product detail page
- Shopping cart (add, update quantity, remove items)
- Checkout with receiver info (name, address, phone)
- Order history and order detail pages

### Admin panel (`/dashboard` — ADMIN role required)
- Dashboard, charts, tables overview
- **Users**: list with search + pagination, create, edit (with avatar upload), delete
- **Products**: list with search + pagination, create, edit (with image upload), delete
- **Orders**: list with status badges, detail view with delivery and payment info

### Auth
- Register / login via username + password (bcrypt)
- Session-based auth (MySQL-backed sessions)
- Role-based access: `ADMIN` role gates the entire admin panel; regular users access cart and orders

---

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, SESSION_SECRET

# 3. Create the database tables
npm run db:push

# 4. (Optional) Seed with sample products and users
npm run db:seed

# 5. Start the dev server
npm run dev
```

The app runs at `http://localhost:5500` by default (configurable via `PORT` in `.env`).

### Environment Variables

```env
PORT=5500
SESSION_SECRET=your_session_secret_here

DATABASE_URL="mysql://root:password@localhost:3306/laptop_shop"
```

---

## Commands

```bash
npm run dev          # Dev server with hot reload + .env loaded
npm run build        # prisma generate + tsc → dist/
npm start            # Run compiled dist/index.js

npm run typecheck    # tsc --noEmit (no output = all good)

npm run db:push      # Sync schema to DB without migrations
npm run db:migrate   # Create a new Prisma migration
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:seed      # Seed the database with sample data
```

---

## Project Structure

```
src/
  index.ts                  # Server startup + graceful shutdown
  app.ts                    # Express config: session, passport, locals, routes
  controllers/              # Request handlers (render EJS or res.json)
  routes/                   # Route modules mounted in src/routes/index.ts
  middleware/
    auth.middleware.ts       # requireAuth, requireAdmin, redirectIfAuthenticated
    error.middleware.ts      # Central error handler → { error: message } JSON
  lib/
    prisma.ts                # Singleton Prisma client
    passport.ts              # LocalStrategy, serialize/deserialize
    pagination.ts            # paginate(total, page, limit) helper
    upload.ts                # Multer config for /uploads
  types/
    express.d.ts             # Express.User type augmentation
    session.d.ts             # express-session SessionData augmentation

views/
  client/                   # Storefront EJS templates + partials
  products/                 # Admin product CRUD views
  users/                    # Admin user CRUD views
  orders/                   # Admin order views
  auth/                     # Login + register pages
  partials/                 # Admin layout partials (head, navbar, sidebar, footer)
  errors/                   # 403 / 404 error pages

public/
  client/                   # Fruitables storefront CSS, JS, images, vendor libs
  uploads/                  # User-uploaded product images and avatars
  css/ js/                  # Admin panel assets (SB Admin 2)

prisma/
  schema.prisma             # Data models: User, Role, UserRole, Product, Cart, CartDetail, Order, OrderItem
  seed.ts                   # Database seeder (scrapes fptshop.com.vn for real laptop data)
```

---

## Routes

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Shop listing (search, sort, filter, paginate) |
| GET | `/shop/:id` | Product detail |
| GET | `/auth/login` | Login page |
| POST | `/auth/login` | Authenticate, redirect by role |
| GET | `/auth/register` | Register page |
| POST | `/auth/register` | Create account |
| POST | `/auth/logout` | Destroy session + redirect |
| GET | `/health` | Health check (includes DB ping) |

### Authenticated users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/cart` | View cart |
| POST | `/cart` | Add item to cart |
| POST | `/cart/:id/update` | Change item quantity |
| POST | `/cart/:id/delete` | Remove item from cart |
| GET | `/checkout` | Checkout form |
| POST | `/checkout` | Place order (atomic transaction) |
| GET | `/orders` | Order history |
| GET | `/orders/:id` | Order detail |

### Admin only (`/admin/*` + `/dashboard`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Admin home |
| GET/POST | `/admin/users` | List / create users |
| GET/POST | `/admin/users/:id/edit` | Edit user |
| POST | `/admin/users/:id/delete` | Delete user |
| GET/POST | `/admin/products` | List / create products |
| GET/POST | `/admin/products/:id/edit` | Edit product |
| POST | `/admin/products/:id/delete` | Delete product |
| GET | `/admin/orders` | List orders |
| GET | `/admin/orders/:id` | Order detail |

---

## Database Schema

```
User ──< UserRole >── Role
User ──< Order ──< OrderItem >── Product
User ── Cart ──< CartDetail >── Product
```

Key design decisions:
- `UserRole` is an explicit M:N junction table — a user can hold multiple roles
- `Cart.sum` tracks total item count for the navbar badge (updated on every cart mutation)
- Orders are created atomically via `prisma.$transaction` — cart is cleared in the same transaction
- Sessions are stored in MySQL via `express-mysql-session` (outside Prisma migrations)

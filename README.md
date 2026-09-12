# Order Splitter — Frontend

React + TypeScript UI for the [ionixx-order-splitter](../ionixx-order-splitter)
backend (Order Splitter API for Robo-Advisor Model Portfolios).

Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + TanStack Query +
React Router + React Hook Form.

## Screens

- **Place Order** (`/orders/new`) — split an order across an inline
  portfolio (typed in directly) or a registered portfolio, and see the
  resulting per-symbol dollar amount / share quantity / execution time.
- **Order History** (`/orders`) — filterable, paginated list of past
  orders (symbol, order type, status, date range), with an expandable
  allocation breakdown per order.
- **Portfolios** (`/portfolios`) — register a model portfolio (name +
  weighted positions, with optional per-symbol price overrides) and
  browse previously registered ones. Each has a "Use for order →" link
  that jumps to Place Order pre-selected.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at the backend if not localhost:3000
```

## Run

```bash
npm run dev      # http://localhost:5173, requires the backend running (see below)
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build locally
npm run lint      # oxlint
```

The backend must be running separately for the app to have any data to
show:

```bash
cd ../ionixx-order-splitter
npm install   # first time only
npm run dev   # http://localhost:3000
```


## API integration notes

- All backend calls live in `src/api/` (`client.ts` has a small
  `fetch` wrapper that throws `ApiRequestError` with the backend's
  `{ error: { code, message, details } }` shape on non-2xx responses;
  `orders.ts`, `portfolios.ts`, `health.ts` wrap the individual
  endpoints).
- `createdAt` / `executionAt` come back from the API as **epoch-millis
  numbers**, not ISO strings (verified against the running backend —
  the design docs describe ISO timestamps, but the implementation uses
  numbers, matching the `from`/`to` query params on `GET /orders` which
  are also epoch millis). The frontend types (`src/api/types.ts`) and
  all date rendering assume numbers.
- Money/quantity values are plain `number`s as returned by the API
  (the backend does its `decimal.js` math server-side and converts to
  `number` at the response boundary) — the frontend does no further
  rounding, it just formats for display.

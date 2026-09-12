// Mirrors the backend's domain types (see ionixx-order-splitter/src/domain/types.ts).

export type OrderType = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING_EXECUTION' | 'EXECUTED';

export interface PortfolioPositionInput {
  symbol: string;
  weight: number; // fraction, 0-1
  price?: number; // optional override of the default fixed price
}

export interface Portfolio {
  portfolioId: string;
  name?: string;
  positions: PortfolioPositionInput[];
  createdAt: number; // epoch millis (UTC)
}

export interface Allocation {
  symbol: string;
  weight: number;
  amount: number; // dollars, rounded to cents
  price: number; // resolved price used (override or default)
  quantity: number; // rounded to quantityDecimalPlaces via largest-remainder apportionment
}

export interface Order {
  orderId: string;
  orderType: OrderType;
  status: OrderStatus;
  totalAmount: number;
  portfolioId?: string;
  allocations: Allocation[];
  quantityDecimalPlaces: number;
  createdAt: number; // epoch millis (UTC)
  executionAt: number; // epoch millis (UTC) — market-hours-aware
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface AppConfig {
  quantityDecimalPlaces: number;
  defaultStockPrice: number;
  marketOpenUtc: string;
  marketCloseUtc: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

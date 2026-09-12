import { apiGet, apiPost } from './client';
import type { AppConfig, Order, OrderStatus, OrderType, Paginated, PortfolioPositionInput } from './types';

export interface PlaceOrderInlineInput {
  orderType: OrderType;
  amount: number;
  portfolio: { positions: PortfolioPositionInput[] };
}

export interface PlaceOrderRegisteredInput {
  orderType: OrderType;
  amount: number;
  portfolioId: string;
}

export type PlaceOrderInput = PlaceOrderInlineInput | PlaceOrderRegisteredInput;

export function placeOrder(input: PlaceOrderInput): Promise<Order> {
  return apiPost<Order>('/api/v1/orders', input);
}

export interface ListOrdersParams {
  symbol?: string;
  orderType?: OrderType;
  status?: OrderStatus;
  from?: number; // epoch millis
  to?: number; // epoch millis
  page?: number;
  limit?: number;
}

export function listOrders(params: ListOrdersParams = {}): Promise<Paginated<Order>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const suffix = qs.toString();
  return apiGet<Paginated<Order>>(`/api/v1/orders${suffix ? `?${suffix}` : ''}`);
}

export function getOrder(orderId: string): Promise<Order> {
  return apiGet<Order>(`/api/v1/orders/${orderId}`);
}

export function getConfig(): Promise<AppConfig> {
  return apiGet<AppConfig>('/api/v1/config');
}

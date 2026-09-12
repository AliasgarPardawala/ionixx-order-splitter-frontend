import { apiGet, apiPost } from './client';
import type { Paginated, Portfolio, PortfolioPositionInput } from './types';

export interface CreatePortfolioInput {
  name?: string;
  positions: PortfolioPositionInput[];
}

export function listPortfolios(page = 1, limit = 20): Promise<Paginated<Portfolio>> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiGet<Paginated<Portfolio>>(`/api/v1/portfolios?${qs.toString()}`);
}

export function getPortfolio(portfolioId: string): Promise<Portfolio> {
  return apiGet<Portfolio>(`/api/v1/portfolios/${portfolioId}`);
}

export function createPortfolio(input: CreatePortfolioInput): Promise<Portfolio> {
  return apiPost<Portfolio>('/api/v1/portfolios', input);
}

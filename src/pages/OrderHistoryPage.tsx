import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listOrders, type ListOrdersParams } from '../api/orders';
import type { OrderStatus, OrderType } from '../api/types';
import ErrorBanner from '../components/ErrorBanner';
import { OrderStatusBadge, OrderTypeBadge } from '../components/StatusBadge';

interface Filters {
  symbol: string;
  orderType: OrderType | '';
  status: OrderStatus | '';
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
}

const EMPTY_FILTERS: Filters = { symbol: '', orderType: '', status: '', from: '', to: '' };
const INPUT_CLASS =
  'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-400';

function toEpochMillis(dateStr: string, endOfDay: boolean): number | undefined {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`).getTime();
}

export default function OrderHistoryPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const params: ListOrdersParams = {
    symbol: filters.symbol.trim() ? filters.symbol.trim().toUpperCase() : undefined,
    orderType: filters.orderType || undefined,
    status: filters.status || undefined,
    from: toEpochMillis(filters.from, false),
    to: toEpochMillis(filters.to, true),
    page,
    limit: 20,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', params],
    queryFn: () => listOrders(params),
  });

  const toggleExpanded = (orderId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">Order history</h2>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Symbol</label>
          <input
            value={filters.symbol}
            onChange={(e) => updateFilter('symbol', e.target.value)}
            placeholder="AAPL"
            className={`mt-1 w-28 uppercase ${INPUT_CLASS}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Order type</label>
          <select
            value={filters.orderType}
            onChange={(e) => updateFilter('orderType', e.target.value as OrderType | '')}
            className={`mt-1 ${INPUT_CLASS}`}
          >
            <option value="">Any</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as OrderStatus | '')}
            className={`mt-1 ${INPUT_CLASS}`}
          >
            <option value="">Any</option>
            <option value="PENDING_EXECUTION">PENDING_EXECUTION</option>
            <option value="EXECUTED">EXECUTED</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter('from', e.target.value)}
            className={`mt-1 ${INPUT_CLASS}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter('to', e.target.value)}
            className={`mt-1 ${INPUT_CLASS}`}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFilters(EMPTY_FILTERS);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Clear
        </button>
      </div>

      <ErrorBanner error={error} />
      {isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p> : null}
      {data && data.data.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No orders match these filters.</p>
      ) : null}

      {data && data.data.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Created (UTC)</th>
                <th className="px-3 py-2">Executes (UTC)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((order) => (
                <Fragment key={order.orderId}>
                  <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {order.orderId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">
                      <OrderTypeBadge orderType={order.orderType} />
                    </td>
                    <td className="px-3 py-2">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">${order.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      {new Date(order.executionAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(order.orderId)}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        {expanded.has(order.orderId) ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expanded.has(order.orderId) ? (
                    <tr className="border-b border-slate-100 bg-slate-50/60 last:border-0 dark:border-slate-800 dark:bg-slate-800/30">
                      <td colSpan={7} className="px-3 py-3">
                        <table className="w-full text-xs">
                          <thead className="text-left uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            <tr>
                              <th className="py-1 pr-4">Symbol</th>
                              <th className="py-1 pr-4">Weight</th>
                              <th className="py-1 pr-4">Amount</th>
                              <th className="py-1 pr-4">Price</th>
                              <th className="py-1 pr-4">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.allocations.map((a) => (
                              <tr key={a.symbol}>
                                <td className="py-1 pr-4 font-medium text-slate-800 dark:text-slate-200">{a.symbol}</td>
                                <td className="py-1 pr-4 text-slate-600 dark:text-slate-300">{(a.weight * 100).toFixed(2)}%</td>
                                <td className="py-1 pr-4 text-slate-600 dark:text-slate-300">${a.amount.toFixed(2)}</td>
                                <td className="py-1 pr-4 text-slate-600 dark:text-slate-300">${a.price.toFixed(2)}</td>
                                <td className="py-1 pr-4 text-slate-600 dark:text-slate-300">{a.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && data.pagination.total > data.pagination.limit ? (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
          >
            Prev
          </button>
          <span className="text-slate-500 dark:text-slate-400">
            Page {page} of {Math.ceil(data.pagination.total / data.pagination.limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * data.pagination.limit >= data.pagination.total}
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

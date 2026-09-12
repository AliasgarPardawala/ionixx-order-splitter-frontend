import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { placeOrder, type PlaceOrderInput } from '../api/orders';
import { listPortfolios } from '../api/portfolios';
import type { Order, OrderType } from '../api/types';
import ErrorBanner from '../components/ErrorBanner';
import { OrderStatusBadge, OrderTypeBadge } from '../components/StatusBadge';

interface PositionFormValue {
  symbol: string;
  weight: string;
  price: string;
}

interface OrderFormValues {
  orderType: OrderType;
  amount: string;
  mode: 'inline' | 'registered';
  portfolioId: string;
  positions: PositionFormValue[];
}

const EMPTY_POSITION: PositionFormValue = { symbol: '', weight: '', price: '' };
const INPUT_CLASS =
  'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-400';

function AllocationResult({ order }: { order: Order }) {
  return (
    <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Order placed</h3>
        <OrderTypeBadge orderType={order.orderType} />
        <OrderStatusBadge status={order.status} />
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{order.orderId}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Total amount</dt>
          <dd className="font-medium text-slate-900 dark:text-white">${order.totalAmount.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Decimal places</dt>
          <dd className="font-medium text-slate-900 dark:text-white">{order.quantityDecimalPlaces}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Created (UTC)</dt>
          <dd className="font-medium text-slate-900 dark:text-white">
            {new Date(order.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Executes (UTC)</dt>
          <dd className="font-medium text-slate-900 dark:text-white">
            {new Date(order.executionAt).toISOString().replace('T', ' ').slice(0, 19)}
          </dd>
        </div>
      </dl>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Weight</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {order.allocations.map((a) => (
              <tr key={a.symbol} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{a.symbol}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{(a.weight * 100).toFixed(2)}%</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">${a.amount.toFixed(2)}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">${a.price.toFixed(2)}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{a.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlaceOrderPage() {
  const [searchParams] = useSearchParams();
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const preselectedPortfolioId = searchParams.get('portfolioId') ?? '';

  const { data: portfoliosPage } = useQuery({
    queryKey: ['portfolios', 'for-order'],
    queryFn: () => listPortfolios(1, 100),
  });

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<OrderFormValues>({
    defaultValues: {
      orderType: 'BUY',
      amount: '',
      mode: preselectedPortfolioId ? 'registered' : 'inline',
      portfolioId: preselectedPortfolioId,
      positions: [{ ...EMPTY_POSITION }, { ...EMPTY_POSITION }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'positions' });
  const mode = watch('mode');

  useEffect(() => {
    if (preselectedPortfolioId) {
      setValue('mode', 'registered');
      setValue('portfolioId', preselectedPortfolioId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPortfolioId]);

  const mutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: (order) => setLastOrder(order),
  });

  const onSubmit: SubmitHandler<OrderFormValues> = (values) => {
    const amount = Number(values.amount);
    const base = { orderType: values.orderType, amount };

    const input: PlaceOrderInput =
      values.mode === 'registered'
        ? { ...base, portfolioId: values.portfolioId }
        : {
            ...base,
            portfolio: {
              positions: values.positions.map((p) => ({
                symbol: p.symbol.trim().toUpperCase(),
                weight: Number(p.weight),
                price: p.price.trim() === '' ? undefined : Number(p.price),
              })),
            },
          };

    mutation.mutate(input);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Order type</label>
            <select {...register('orderType')} className={`mt-1 ${INPUT_CLASS}`}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (USD)</label>
            <input
              {...register('amount', { required: true })}
              type="number"
              step="any"
              min={0}
              placeholder="10000"
              className={`mt-1 ${INPUT_CLASS}`}
            />
          </div>
        </div>

        <div>
          <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setValue('mode', 'inline')}
              className={clsx(
                'rounded-md px-3 py-1 font-medium',
                mode === 'inline'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400',
              )}
            >
              Inline portfolio
            </button>
            <button
              type="button"
              onClick={() => setValue('mode', 'registered')}
              className={clsx(
                'rounded-md px-3 py-1 font-medium',
                mode === 'registered'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400',
              )}
            >
              Registered portfolio
            </button>
          </div>
        </div>

        {mode === 'registered' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Portfolio</label>
            <select
              {...register('portfolioId', { required: mode === 'registered' })}
              className={`mt-1 w-full max-w-md ${INPUT_CLASS}`}
            >
              <option value="">Select a portfolio…</option>
              {portfoliosPage?.data.map((p) => (
                <option key={p.portfolioId} value={p.portfolioId}>
                  {p.name || p.portfolioId} ({p.positions.map((pos) => pos.symbol).join('/')})
                </option>
              ))}
            </select>
            {portfoliosPage && portfoliosPage.data.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                No registered portfolios yet — register one on the Portfolios page, or use an inline portfolio.
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Positions</label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                    {...register(`positions.${index}.symbol` as const, { required: mode === 'inline' })}
                    placeholder="AAPL"
                    className={`w-24 uppercase ${INPUT_CLASS}`}
                  />
                  <input
                    {...register(`positions.${index}.weight` as const, { required: mode === 'inline' })}
                    type="number"
                    step="any"
                    min={0}
                    max={1}
                    placeholder="weight (0-1)"
                    className={`w-32 ${INPUT_CLASS}`}
                  />
                  <input
                    {...register(`positions.${index}.price` as const)}
                    type="number"
                    step="any"
                    min={0}
                    placeholder="price override (optional)"
                    className={`w-48 ${INPUT_CLASS}`}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    className="rounded-md px-2 py-1 text-sm text-slate-400 hover:text-rose-600 disabled:opacity-30 dark:text-slate-500 dark:hover:text-rose-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => append({ ...EMPTY_POSITION })}
              className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              + Add position
            </button>
          </div>
        )}

        <ErrorBanner error={mutation.error} />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {mutation.isPending ? 'Splitting…' : 'Split order'}
          </button>
          {lastOrder ? (
            <button
              type="button"
              onClick={() => {
                setLastOrder(null);
                reset();
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              New order
            </button>
          ) : null}
        </div>
      </form>

      {lastOrder ? <AllocationResult order={lastOrder} /> : null}
    </div>
  );
}

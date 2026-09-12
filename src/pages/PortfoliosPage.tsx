import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortfolio, listPortfolios } from '../api/portfolios';
import ErrorBanner from '../components/ErrorBanner';

interface PositionFormValue {
  symbol: string;
  weight: string;
  price: string;
}

interface PortfolioFormValues {
  name: string;
  positions: PositionFormValue[];
}

const EMPTY_POSITION: PositionFormValue = { symbol: '', weight: '', price: '' };

function weightSum(positions: PositionFormValue[]): number {
  return positions.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
}

function PortfolioForm({ onCreated }: { onCreated: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PortfolioFormValues>({
    defaultValues: { name: '', positions: [{ ...EMPTY_POSITION }, { ...EMPTY_POSITION }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'positions' });
  const positions = watch('positions');
  const sum = weightSum(positions ?? []);
  const sumOk = Math.abs(sum - 1) <= 0.005;

  const mutation = useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => {
      reset({ name: '', positions: [{ ...EMPTY_POSITION }, { ...EMPTY_POSITION }] });
      onCreated();
    },
  });

  const onSubmit: SubmitHandler<PortfolioFormValues> = (values) => {
    mutation.mutate({
      name: values.name.trim() || undefined,
      positions: values.positions.map((p) => ({
        symbol: p.symbol.trim().toUpperCase(),
        weight: Number(p.weight),
        price: p.price.trim() === '' ? undefined : Number(p.price),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name (optional)</label>
        <input
          {...register('name')}
          type="text"
          placeholder="Balanced Growth"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">Positions</label>
          <span className={sumOk ? 'text-xs text-emerald-600' : 'text-xs text-amber-600'}>
            Weights sum to {sum.toFixed(4)} {sumOk ? '✓' : '(must be 1.0 ± 0.005)'}
          </span>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                {...register(`positions.${index}.symbol` as const, { required: true })}
                placeholder="AAPL"
                className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm uppercase focus:border-slate-500 focus:outline-none"
              />
              <input
                {...register(`positions.${index}.weight` as const, { required: true })}
                type="number"
                step="any"
                min={0}
                max={1}
                placeholder="weight (0-1)"
                className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                {...register(`positions.${index}.price` as const)}
                type="number"
                step="any"
                min={0}
                placeholder="price override (optional)"
                className="w-48 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
                className="rounded-md px-2 py-1 text-sm text-slate-400 hover:text-rose-600 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {errors.positions ? <p className="mt-1 text-xs text-rose-600">Every position needs a symbol and a weight.</p> : null}
        <button
          type="button"
          onClick={() => append({ ...EMPTY_POSITION })}
          className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          + Add position
        </button>
      </div>

      <ErrorBanner error={mutation.error} />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {mutation.isPending ? 'Registering…' : 'Register portfolio'}
      </button>
    </form>
  );
}

export default function PortfoliosPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolios', page],
    queryFn: () => listPortfolios(page, 20),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['portfolios'] });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Register a model portfolio</h2>
        <PortfolioForm onCreated={refresh} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Registered portfolios</h2>
        <ErrorBanner error={error} />
        {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {data && data.data.length === 0 ? (
          <p className="text-sm text-slate-500">No portfolios registered yet.</p>
        ) : null}
        {data && data.data.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Positions</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((portfolio) => (
                  <tr key={portfolio.portfolioId} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-900">{portfolio.name || '(untitled)'}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {portfolio.positions.map((p) => `${p.symbol} ${(p.weight * 100).toFixed(1)}%`).join(', ')}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{new Date(portfolio.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/orders/new?portfolioId=${portfolio.portfolioId}`}
                        className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        Use for order →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {data && data.pagination.total > data.pagination.limit ? (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-slate-500">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * data.pagination.limit >= data.pagination.total}
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

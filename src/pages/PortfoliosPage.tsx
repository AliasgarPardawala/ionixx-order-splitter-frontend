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
const INPUT_CLASS =
  'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-400';

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name (optional)</label>
        <input {...register('name')} type="text" placeholder="Balanced Growth" className={`mt-1 w-full ${INPUT_CLASS}`} />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Positions</label>
          <span className={sumOk ? 'text-xs text-emerald-600 dark:text-emerald-400' : 'text-xs text-amber-600 dark:text-amber-400'}>
            Weights sum to {sum.toFixed(4)} {sumOk ? '✓' : '(must be 1.0 ± 0.005)'}
          </span>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                {...register(`positions.${index}.symbol` as const, { required: true })}
                placeholder="AAPL"
                className={`w-24 uppercase ${INPUT_CLASS}`}
              />
              <input
                {...register(`positions.${index}.weight` as const, { required: true })}
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
        {errors.positions ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Every position needs a symbol and a weight.</p>
        ) : null}
        <button
          type="button"
          onClick={() => append({ ...EMPTY_POSITION })}
          className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          + Add position
        </button>
      </div>

      <ErrorBanner error={mutation.error} />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
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
        <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Register a model portfolio</h2>
        <PortfolioForm onCreated={refresh} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Registered portfolios</h2>
        <ErrorBanner error={error} />
        {isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p> : null}
        {data && data.data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No portfolios registered yet.</p>
        ) : null}
        {data && data.data.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Positions</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((portfolio) => (
                  <tr key={portfolio.portfolioId} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{portfolio.name || '(untitled)'}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {portfolio.positions.map((p) => `${p.symbol} ${(p.weight * 100).toFixed(1)}%`).join(', ')}
                    </td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{new Date(portfolio.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/orders/new?portfolioId=${portfolio.portfolioId}`}
                        className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
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
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Prev
            </button>
            <span className="text-slate-500 dark:text-slate-400">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * data.pagination.limit >= data.pagination.total}
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

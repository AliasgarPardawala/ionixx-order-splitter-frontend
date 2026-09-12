import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { getHealth } from '../api/health';
import { API_BASE_URL } from '../config';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/orders/new', label: 'Place Order' },
  { to: '/orders', label: 'Order History' },
  { to: '/portfolios', label: 'Portfolios' },
];

function HealthIndicator() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 15_000,
    retry: false,
  });

  const ok = !isError && data?.status === 'ok';

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" title={API_BASE_URL}>
      <span
        className={clsx('h-2 w-2 rounded-full', ok ? 'bg-emerald-500' : 'bg-rose-500')}
        aria-hidden
      />
      <span className="font-mono">{API_BASE_URL.replace(/^https?:\/\//, '')}</span>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Order Splitter</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Robo-advisor model portfolio order splitting</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <ThemeToggle />
            <HealthIndicator />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

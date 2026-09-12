import clsx from 'clsx';
import type { OrderStatus, OrderType } from '../api/types';

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_EXECUTION:
    'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20',
  EXECUTED:
    'bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20',
};

const ORDER_TYPE_STYLES: Record<OrderType, string> = {
  BUY: 'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/20',
  SELL: 'bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/20',
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        className,
      )}
    >
      {label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={status.replace('_', ' ')} className={ORDER_STATUS_STYLES[status]} />;
}

export function OrderTypeBadge({ orderType }: { orderType: OrderType }) {
  return <Badge label={orderType} className={ORDER_TYPE_STYLES[orderType]} />;
}

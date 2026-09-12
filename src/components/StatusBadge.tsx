import clsx from 'clsx';
import type { OrderStatus, OrderType } from '../api/types';

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_EXECUTION: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  EXECUTED: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
};

const ORDER_TYPE_STYLES: Record<OrderType, string> = {
  BUY: 'bg-sky-100 text-sky-800 ring-sky-600/20',
  SELL: 'bg-rose-100 text-rose-800 ring-rose-600/20',
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

import { STATUS_LABEL } from '../lib/format';
import type { AppointmentStatus } from '../types';

interface TimelineItem {
  status: AppointmentStatus;
  message: string;
  at: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-5 border-l border-hairline pl-5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <li key={`${item.status}-${item.at}`} className="relative">
            <span
              className={`absolute -left-[1.6875rem] top-1 h-3 w-3 rounded-full border-2 border-white ${
                isLast ? 'bg-brand-500 ring-4 ring-brand-100' : 'bg-hairline'
              }`}
              aria-hidden
            />
            <p className="text-sm font-semibold">{STATUS_LABEL[item.status]}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{item.message}</p>
            <time className="mt-1 block text-xs text-ink-faint" dateTime={item.at}>
              {new Intl.DateTimeFormat('es-CO', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              }).format(new Date(item.at))}
            </time>
          </li>
        );
      })}
    </ol>
  );
}

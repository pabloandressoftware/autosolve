import { STATUS_LABEL, STATUS_TONE } from '../lib/format';
import type { AppointmentStatus } from '../types';

export function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

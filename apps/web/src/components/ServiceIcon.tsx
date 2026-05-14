import { Battery, CircleDot, Droplet, Gauge, Disc3, Wrench, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  wrench: Wrench,
  brake: Disc3,
  gauge: Gauge,
  battery: Battery,
  droplet: Droplet,
  tire: CircleDot,
};

export function ServiceIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Wrench;
  return <Icon className={className} aria-hidden />;
}

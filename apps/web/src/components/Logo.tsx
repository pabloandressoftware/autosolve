interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

/** Carro naranja del prototipo, dibujado en SVG para que escale sin pixelarse. */
export function Logo({ size = 96, withWordmark = true }: LogoProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size * 0.62}
        viewBox="0 0 160 100"
        role="img"
        aria-label="AutoSolve"
        fill="none"
      >
        <path
          d="M18 74V56c0-3 .8-6 2.4-8.6l11-18C34 25 39 22 44.5 22h71c5.5 0 10.5 3 13.1 7.4l11 18A16.5 16.5 0 0 1 142 56v18a6 6 0 0 1-6 6h-9a6 6 0 0 1-6-6v-3H39v3a6 6 0 0 1-6 6h-9a6 6 0 0 1-6-6Z"
          fill="#f97316"
        />
        <path
          d="M45 30h70c2.6 0 5 1.4 6.3 3.6L130 48H30l8.7-14.4A7.4 7.4 0 0 1 45 30Z"
          fill="#fff7ed"
        />
        <circle cx="42" cy="60" r="7" fill="#fff" />
        <circle cx="118" cy="60" r="7" fill="#fff" />
        <rect x="60" y="70" width="40" height="5" rx="2.5" fill="#fff7ed" />
      </svg>

      {withWordmark && (
        <div className="text-center leading-none">
          <p className="text-2xl font-bold tracking-tight text-ink">AutoSolve</p>
          <p className="mt-1 text-sm text-ink-muted">Energitéca</p>
        </div>
      )}
    </div>
  );
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Naranja de la marca Energitéca, tal como aparece en el prototipo.
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
          faint: '#94a3b8',
        },
        canvas: '#f8fafc',
        hairline: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)',
      },
      maxWidth: {
        app: '28rem',
      },
    },
  },
  plugins: [],
};

import { describe, expect, it } from 'vitest';

import { formatCop, formatDuration } from './format';

describe('formatCop', () => {
  it('usa el formato colombiano con el símbolo pegado al número', () => {
    expect(formatCop(80_000)).toBe('$80.000');
    expect(formatCop(120_000)).toBe('$120.000');
  });

  it('no muestra decimales', () => {
    expect(formatCop(25_000)).not.toContain(',');
  });
});

describe('formatDuration', () => {
  it('muestra los minutos por debajo de una hora', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('muestra horas exactas sin minutos sobrantes', () => {
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(120)).toBe('2 h');
  });

  it('combina horas y minutos', () => {
    expect(formatDuration(75)).toBe('1 h 15 min');
  });
});

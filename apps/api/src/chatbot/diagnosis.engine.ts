import { Injectable } from '@nestjs/common';
import { Urgency } from '@prisma/client';

export interface SymptomRule {
  slug: string;
  label: string;
  keywords: string[];
  urgency: Urgency;
  serviceId: string;
}

export interface Diagnosis {
  symptom: SymptomRule;
  score: number;
  matched: string[];
}

/** Quita tildes y signos para que «batería» y «bateria» sean el mismo término. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Puntaje mínimo para dar un diagnóstico en lugar de pedir más detalle. */
export const CONFIDENCE_THRESHOLD = 1;

const URGENCY_ORDER: Record<Urgency, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };

/**
 * Motor de diagnóstico basado en reglas. Es determinista y sin dependencias
 * externas a propósito: la prueba piloto mostró que los usuarios necesitan una
 * respuesta inmediata y predecible, no una conversación abierta.
 */
@Injectable()
export class DiagnosisEngine {
  /**
   * Puntúa cada síntoma contra el texto del usuario. Una palabra clave de varias
   * palabras («no enciende») vale más que una sola, porque es menos ambigua.
   */
  rank(text: string, rules: SymptomRule[]): Diagnosis[] {
    const haystack = normalize(text);

    if (!haystack) {
      return [];
    }

    return rules
      .map((symptom) => {
        const matched = symptom.keywords.filter((keyword) => this.matches(haystack, keyword));
        const score = matched.reduce((total, keyword) => total + this.weight(keyword), 0);

        return { symptom, score, matched };
      })
      .filter((result) => result.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || URGENCY_ORDER[a.symptom.urgency] - URGENCY_ORDER[b.symptom.urgency],
      );
  }

  best(text: string, rules: SymptomRule[]): Diagnosis | null {
    const [top] = this.rank(text, rules);
    return top && top.score >= CONFIDENCE_THRESHOLD ? top : null;
  }

  /** Coincidencia por palabra completa, para que «rin» no dispare dentro de «primer». */
  private matches(haystack: string, keyword: string): boolean {
    const needle = normalize(keyword);

    if (!needle) {
      return false;
    }

    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(haystack);
  }

  private weight(keyword: string): number {
    return normalize(keyword).split(' ').length;
  }
}

// Dynamic, data-driven evaluation-matrix engine.
//
// Unlike the original humanoid dashboard (which used hand-curated 1-5 scores),
// this engine derives each robot's per-criterion score from the LIVE database
// values, normalized across the set of robots being compared. Users can add or
// remove any numeric spec as a criterion, flip its direction, and tune weights —
// all in the browser (session-only, nothing is persisted).

import { getField, NUMERIC_FIELDS } from "./robotFields";

export interface MatrixCriterion {
  id: string; // unique row id (allows the same field twice if desired)
  fieldKey: string; // which robot numeric field this scores
  weight: number; // relative weight (normalized to 100% at display time)
  higherIsBetter: boolean; // scoring direction
}

/**
 * How raw-spec criteria (no fixed 0-5 scale) are turned into a 0-100 score:
 * - "proportional": value as a share of the best value (best = 5, others scale
 *   proportionally). Intuitive default — a 5kg payload vs a 6.5kg best = 3.8/5.
 * - "relative": min-max spread (worst = 0, best = 5). Maximizes contrast but
 *   makes the lowest value look bad even when it's objectively fine.
 * Curated 1-5 score fields and yes/no fields are always scored absolutely.
 */
export type NormalizationMode = "proportional" | "relative";

export interface CriterionScore {
  criterionId: string;
  fieldKey: string;
  rawValue: number | null;
  normalized: number; // 0-100 relative to the compared set
  hasValue: boolean;
}

export interface RobotMatrixResult {
  robot: any;
  perCriterion: CriterionScore[];
  weightedScore: number; // 0-100
}

let _seq = 0;
export function newCriterionId(): string {
  _seq += 1;
  return `crit_${_seq}`;
}

// Default preset mirrors the original research-focused matrix.
export function defaultCriteria(): MatrixCriterion[] {
  const preset: { fieldKey: string; weight: number }[] = [
    { fieldKey: "scoreRos2Support", weight: 20 },
    { fieldKey: "scoreSdkOpenness", weight: 18 },
    { fieldKey: "scoreSimulationSupport", weight: 16 },
    { fieldKey: "scoreComputePower", weight: 15 },
    { fieldKey: "scoreDeveloperCommunity", weight: 13 },
    { fieldKey: "scoreDexterity", weight: 12 },
    { fieldKey: "scoreResearchOverall", weight: 6 },
  ];
  return preset.map((p) => {
    const field = getField(p.fieldKey);
    return {
      id: newCriterionId(),
      fieldKey: p.fieldKey,
      weight: p.weight,
      higherIsBetter: field?.higherIsBetter ?? true,
    };
  });
}

// A spec-driven preset for mobile manipulators / arms.
export function specCriteria(): MatrixCriterion[] {
  const preset: { fieldKey: string; weight: number }[] = [
    { fieldKey: "usablePayload", weight: 25 },
    { fieldKey: "reach", weight: 20 },
    { fieldKey: "armDof", weight: 15 },
    { fieldKey: "batteryLife", weight: 15 },
    { fieldKey: "maxSpeed", weight: 10 },
    { fieldKey: "rosCompatible", weight: 15 },
  ];
  return preset.map((p) => {
    const field = getField(p.fieldKey);
    return {
      id: newCriterionId(),
      fieldKey: p.fieldKey,
      weight: p.weight,
      higherIsBetter: field?.higherIsBetter ?? true,
    };
  });
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "boolean" ? (value ? 1 : 0) : Number(value);
  return Number.isFinite(n) ? n : null;
}

// Compute normalized (0-100) scores and weighted totals for the given robots.
export function computeMatrix(
  robots: any[],
  criteria: MatrixCriterion[],
  mode: NormalizationMode = "proportional"
): RobotMatrixResult[] {
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  // Per-criterion min/max across the compared robots (relative normalization).
  const ranges = new Map<string, { min: number; max: number }>();
  for (const c of criteria) {
    const values = robots
      .map((r) => toNumber(r[c.fieldKey]))
      .filter((v): v is number => v !== null);
    if (values.length > 0) {
      ranges.set(c.id, { min: Math.min(...values), max: Math.max(...values) });
    }
  }

  // Fields with a fixed scale are scored ABSOLUTELY so the displayed value
  // matches the stored data (a curated 4/5 shows as 4.0/5, regardless of what
  // the other robots scored). Raw specs with no natural max stay relative.
  const absoluteMaxFor = (fieldKey: string): number | undefined => {
    const field = getField(fieldKey);
    if (field?.scoreMax) return field.scoreMax; // curated 1-5 scores
    if (field?.format === "boolean") return 1; // yes/no -> 5 or 0
    return undefined;
  };

  return robots
    .map((robot) => {
      const perCriterion: CriterionScore[] = criteria.map((c) => {
        const raw = toNumber(robot[c.fieldKey]);
        const range = ranges.get(c.id);
        let normalized = 0;
        const hasValue = raw !== null;

        const absMax = absoluteMaxFor(c.fieldKey);

        if (hasValue && absMax) {
          // Absolute: value as a fraction of the fixed maximum.
          const pct = Math.min(1, Math.max(0, (raw as number) / absMax));
          normalized = (c.higherIsBetter ? pct : 1 - pct) * 100;
        } else if (hasValue && range) {
          const value = raw as number;
          if (range.max === range.min) {
            // Everyone ties — award full marks so weight still counts.
            normalized = 100;
          } else if (mode === "proportional") {
            // Share of the best value (no artificial zero for the lowest).
            let pct: number;
            if (c.higherIsBetter) {
              pct = range.max > 0 ? value / range.max : 0;
            } else {
              // Lower is better: best (smallest) = 1, scaled by best/value.
              pct = value <= range.min ? 1 : range.min / value;
            }
            normalized = Math.min(1, Math.max(0, pct)) * 100;
          } else {
            // Relative min-max spread (worst = 0, best = 100).
            const pct = (value - range.min) / (range.max - range.min);
            normalized = (c.higherIsBetter ? pct : 1 - pct) * 100;
          }
        }

        return {
          criterionId: c.id,
          fieldKey: c.fieldKey,
          rawValue: raw,
          normalized: Math.round(normalized),
          hasValue,
        };
      });

      const weightedScore =
        totalWeight > 0
          ? Math.round(
              perCriterion.reduce((sum, score, i) => {
                const weight = criteria[i].weight || 0;
                return sum + (score.normalized * weight) / totalWeight;
              }, 0)
            )
          : 0;

      return { robot, perCriterion, weightedScore };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

// First numeric field not already used — handy default for "Add criterion".
export function firstUnusedField(criteria: MatrixCriterion[]): string {
  const used = new Set(criteria.map((c) => c.fieldKey));
  const candidate = NUMERIC_FIELDS.find((f) => !used.has(f.key));
  return (candidate ?? NUMERIC_FIELDS[0]).key;
}


// scoring.ts
export const SCORE_MAP = {
  client_volatility: { LOW: 20, MEDIUM: 50, HIGH: 80 },
  iteration_intensity: { LOW: 15, MEDIUM: 45, HIGH: 85 },
  senior_involvement: { RARE: 25, OCCASIONAL: 50, FREQUENT: 75 },
  stakeholder_complexity: { LOW: 20, MEDIUM: 50, HIGH: 80 }
};

export function normalize(input) {
  const scores = {};
  for (const key in input) {
    scores[key] = SCORE_MAP[key][input[key]];
  }
  return scores;
}

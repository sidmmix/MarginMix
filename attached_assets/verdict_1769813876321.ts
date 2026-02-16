
// verdict.ts
export function classifyVerdict(buckets) {
  if (buckets.WI > 70 && buckets.SI > 70) return "Moderate–High Margin Risk";
  if (buckets.WI > 50) return "Moderate Margin Risk";
  return "Low Margin Risk";
}

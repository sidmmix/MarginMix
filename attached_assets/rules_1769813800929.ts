
// rules.ts
export function applyContextMultipliers(buckets, context) {
  if (context.scope_expansion) {
    buckets.WI *= 1.2;
    buckets.SI *= 1.2;
    buckets.CO *= 1.15;
  }
  return buckets;
}

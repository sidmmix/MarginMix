
// buckets.ts
export function computeBuckets(scores) {
  return {
    WI: average(scores.client_volatility, scores.iteration_intensity),
    SI: average(scores.senior_involvement),
    CO: average(scores.stakeholder_complexity),
    VSI: scores.value_saturation,
    CE: scores.commercial_elasticity
  };
}

function average(...nums) {
  return nums.reduce((a,b)=>a+b,0)/nums.length;
}

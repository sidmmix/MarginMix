/** Presentation only. Never feed these reporting bands or ranks into scoring. */
export const REPORT_GROUPS = [
  { key: "WI", id: "workforceIntensity", name: "Workforce Intensity" },
  { key: "CO", id: "coordinationEntropy", name: "Coordination Entropy" },
  { key: "CE", id: "commercialExposure", name: "Commercial Exposure" },
  { key: "VC", id: "volatilityControl", name: "Volatility Control" },
  { key: "MM", id: "measurementMaturity", name: "AI Substitution and Measurement Risk" },
] as const;

export type ReportBand = "Low" | "Medium" | "Elevated" | "High";
export type ReportScores = Record<typeof REPORT_GROUPS[number]["key"], number>;

export function reportBand(score: number): ReportBand {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error("Report group score must be between 0 and 100.");
  }
  // Use raw scores; e.g. 24.99 is Low, 25 is Medium.
  return score < 25 ? "Low" : score < 50 ? "Medium" : score < 75 ? "Elevated" : "High";
}

export function buildReportGroups(scores: ReportScores) {
  const groups = REPORT_GROUPS.map(group => ({
    ...group, score: scores[group.key], band: reportBand(scores[group.key]),
  }));
  const highest = Math.max(...groups.map(group => group.score));
  const lowest = Math.min(...groups.map(group => group.score));
  const summaries = groups.map(group => {
    const rank = 1 + groups.filter(other => other.score > group.score).length;
    const tied = groups.filter(other => other.score === group.score).length > 1;
    const primary = group.score === highest && highest > 0;
    const role = primary ? "primary driver" : "relative strength";
    const comparison = highest === lowest
      ? "All five groups have the same score; none is stronger or weaker relative to the others."
      : primary
        ? "It has the highest risk score among the five groups."
        : "This is relative to higher scoring groups, not necessarily low risk in absolute terms.";
    return {
      ...group, rank, role,
      description: `${group.name} scores ${Number(group.score.toFixed(1))}/100 (${group.band} band), ${tied ? "joint " : ""}rank ${rank} of 5 from highest to lowest risk. It is a ${tied && primary ? "joint " : ""}${role}. ${comparison}${group.key === "MM" ? " Higher scores mean greater AI substitution and measurement risk, not stronger measurement capability." : ""}`,
    };
  });
  const namesAt = (score: number) => groups.filter(group => group.score === score).map(group => group.name).join(" and ");
  const comparativeSentence = highest === lowest
    ? `All five groups are tied at ${Number(highest.toFixed(1))}/100; ${namesAt(highest)} share both the highest and lowest score.`
    : `The highest scoring ${groups.filter(group => group.score === highest).length > 1 ? "groups are" : "group is"} ${namesAt(highest)} (${Number(highest.toFixed(1))}/100); the lowest scoring ${groups.filter(group => group.score === lowest).length > 1 ? "groups are" : "group is"} ${namesAt(lowest)} (${Number(lowest.toFixed(1))}/100).`;
  return { groups: summaries, comparativeSentence };
}

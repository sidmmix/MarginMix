import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/neon-serverless";
import {
  cpmBenchmarks,
  insertCpmBenchmarkSchema,
  insertMarginAssessmentSchema,
} from "./schema";

test("assessment input keeps its required fields and validation", () => {
  const valid = {
    fullName: "Test Person",
    workEmail: "test@example.com",
    roleTitle: "Director",
    organisationName: "Example Company",
    organisationSize: "50-500",
    engagementType: "retainer",
    clientVolatility: "low",
    stakeholderComplexity: "low",
    seniorLeadershipInvolvement: "low",
    midLevelOversight: "low",
    executionThinkingMix: "balanced",
    iterationIntensity: "low",
    scopeChangeLikelihood: "low",
    crossFunctionalCoordination: "low",
  };

  assert.equal(insertMarginAssessmentSchema.safeParse(valid).success, true);
  assert.equal(insertMarginAssessmentSchema.safeParse({ ...valid, fullName: undefined }).success, false);
});

test("benchmark vectors validate and Drizzle can build insert SQL without a database", () => {
  const benchmark = {
    industry: "Technology",
    platform: "Search",
    objective: "Awareness",
    embedding: Array(3072).fill(0.1) as number[],
  };
  const parsed = insertCpmBenchmarkSchema.parse(benchmark);
  const query = drizzle.mock().insert(cpmBenchmarks).values(parsed).toSQL();

  assert.match(query.sql, /insert into "cpm_benchmarks"/i);
  assert.ok(query.params.length > 0);
  assert.equal(
    insertCpmBenchmarkSchema.safeParse({ ...benchmark, embedding: [0.1] }).success,
    false,
  );
});
// This file contains utilities for working with OpenAI responses
// The actual OpenAI integration is handled on the backend

export interface AIResponse {
  isValid: boolean;
  insights: string;
  suggestions: string[];
}

export interface CampaignInsights {
  budgetAllocation: Record<string, number>;
  platformStrategies: Record<string, string>;
  kpis: string[];
  recommendations: string[];
  estimatedReach: string;
  estimatedCPM: string;
}

export function validateResponse(response: any): AIResponse {
  return {
    isValid: response.isValid || false,
    insights: response.insights || "",
    suggestions: response.suggestions || [],
  };
}

export function validateInsights(insights: any): CampaignInsights {
  return {
    budgetAllocation: insights.budgetAllocation || {},
    platformStrategies: insights.platformStrategies || {},
    kpis: insights.kpis || [],
    recommendations: insights.recommendations || [],
    estimatedReach: insights.estimatedReach || "TBD",
    estimatedCPM: insights.estimatedCPM || "TBD",
  };
}

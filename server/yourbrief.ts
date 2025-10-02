import axios from 'axios';
import {
  mapIndustry,
  mapDemographics,
  mapBudget,
  mapSeasonality
} from './mappers';

// API Configuration
const apiEndpoint = 'https://api.yourbrief.ai/advisor/brief';
const apiKey = process.env.YOURBRIEF_API_KEY || '';

// Axios Instance Setup
const apiInstance = axios.create({
  baseURL: apiEndpoint,
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

interface PlatformInsights {
  reach?: string | number;
  impressions?: string | number;
  ctr?: string | number;
  cpc?: string | number;
  cpa?: string | number;
}

interface YourBriefResponse {
  media_mix?: string[];
  reach_and_impressions?: Record<string, PlatformInsights>;
  performance_projections?: Record<string, PlatformInsights>;
}

export interface YourBriefPlatformInsights {
  [platform: string]: {
    reach?: string | number;
    impressions?: string | number;
    ctr?: string | number;
    cpc?: string | number;
    cpa?: string | number;
  };
}

// Function to fetch platform insights from YourBrief API
export async function getYourBriefInsights(
  industryInput: string,
  demoInput: string,
  budgetInput: string,
  seasonInput: string
): Promise<YourBriefPlatformInsights | null> {
  try {
    // Prepare Brief Data
    const briefData = {
      industry: mapIndustry(industryInput),
      ...mapDemographics(demoInput),
      ...mapBudget(budgetInput),
      season: mapSeasonality(seasonInput)
    };

    console.log('--- Sending Brief Data to YourBrief API ---');
    console.log(briefData);

    // Send Data to API
    const response = await apiInstance.post<YourBriefResponse>('', briefData);

    console.log('--- YourBrief API Response Received ---');

    // Extract platform insights
    const mediaMix = response.data.media_mix || [];
    const platformInsights: YourBriefPlatformInsights = {};

    mediaMix.forEach(channel => {
      const channelData = response.data.reach_and_impressions?.[channel] || {};
      const perfData = response.data.performance_projections?.[channel] || {};

      platformInsights[channel] = {
        reach: channelData.reach,
        impressions: channelData.impressions,
        ctr: perfData.ctr,
        cpc: perfData.cpc,
        cpa: perfData.cpa
      };
    });

    console.log('--- Platform Insights Extracted ---');
    console.log(platformInsights);

    return platformInsights;
  } catch (error) {
    console.error('YourBrief API Call Failed.');
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data || error.message);
    } else {
      console.error(error);
    }
    return null;
  }
}

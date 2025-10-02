const axios = require('axios');
const {
  mapIndustry,
  mapDemographics,
  mapBudget,
  mapSeasonality
} = require('./mappers');

// API Configuration
const apiEndpoint = 'https://api-sandbox.yourbrief.ai/advisor/brief';
// NOTE: Agent should advise user to set these as Replit Secrets
const apiKey = process.env.YOURBRIEF_API_KEY || 'YOURBRIEF_SANDBOX_API_KEY_001'; 
// const apiSecret = 'tbV8yK4LpL6HJ7qC'; // Secret not used directly in this call, but keep it in mind

// Axios Instance Setup
const apiInstance = axios.create({
  baseURL: apiEndpoint,
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

// Define the function to execute the API call
async function runAPICall(industryInput, demoInput, budgetInput, seasonInput) {
  // 1. Prepare Brief Data
  const briefData = {
    industry: mapIndustry(industryInput),
    ...mapDemographics(demoInput), 
    ...mapBudget(budgetInput), 
    season: mapSeasonality(seasonInput)
  };

  try {
    console.log('--- Sending Brief Data ---');
    console.log(briefData);
    
    // 2. Send Data to API
    const response = await apiInstance.post('', briefData);
    
    console.log('--- API Response Received ---');
    
    // 3. Dynamic Response Handling
    const briefIndustry = briefData.industry;
    const briefGeo = briefData.geo; 
    const briefBudget = briefData.budget_inr || briefData.budget_usd;
    const briefSeason = briefData.season;
    
    const mediaMix = response.data.media_mix || []; // Use empty array as fallback
    
    mediaMix.forEach(channel => {
      const channelData = response.data.reach_and_impressions[channel] || {};
      const perfData = response.data.performance_projections[channel] || {};

      const reach = channelData.reach;
      const impressions = channelData.impressions;
      const ctr = perfData.ctr;
      const cpc = perfData.cpc;
      const cpa = perfData.cpa;
      
      // Budget check logic: remove non-digits/non-decimals and parse to float
      const cleanedBudget = briefBudget ? parseFloat(String(briefBudget).replace(/[^0-9.]/g, '')) : 0;

      if (briefIndustry === 'E-commerce') {
        console.log(`E-commerce: Focus on ${channel} CPA: ${cpa}`);
      } else if (briefGeo === 'IN') {
        console.log(`India: High traffic ${channel} impressions: ${impressions}`);
      } 
      else if (cleanedBudget < 1000000) {
        console.log(`Low Budget: Efficiency focus on ${channel} CTR: ${ctr}`);
      } else if (briefSeason && briefSeason.includes('Holiday')) {
        console.log(`Holiday Season: Max reach for ${channel}: ${reach}`);
      } else {
        console.log(`Default handling for ${channel}: CPC is ${cpc}`);
      }
    });

    console.log('\n--- Dynamic response handling complete ---');

  } catch (error) {
    console.error('API Call Failed.');
    console.error(error.response ? error.response.data : error.message);
  }
}


// --- Execute the function with example data ---
runAPICall('d2c_beauty', 'india_inmarket', 'inr_10_20l', 'only_festive');

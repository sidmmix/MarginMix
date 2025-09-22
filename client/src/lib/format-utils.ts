// Utility functions for formatting campaign data display values

// Budget options mapping for proper formatting
const budgetLabels: Record<string, string> = {
  'inr_under_10l': '₹ < 10 lakhs',
  'inr_10_20l': '₹ 10 lakhs to 20 lakhs',
  'inr_20_40l': '₹ 20 lakhs to 40 lakhs', 
  'inr_40_80l': '₹ 40 lakhs to 80 lakhs',
  'inr_80l_plus': '₹ 80 lakhs+',
  'inr_2cr_plus': '₹ 2 crores+',
  'usd_under_100k': '$ < 100,000',
  'usd_100_200k': '$ 100,000 to 200,000',
  'usd_200_500k': '$ 200,000 to 500,000',
  'usd_500_800k': '$ 500,000 to 800,000',
  'usd_800_1500k': '$ 800,000 to 1,500,000',
  'usd_1500_3000k': '$ 1,500,000 to 3,000,000',
  'usd_3m_plus': '$ 3 mn+',
  'usd_5m_plus': '$ 5 mn+'
};

// Platform options mapping
const platformLabels: Record<string, string> = {
  'youtube': 'YouTube',
  'meta': 'Meta',
  'both': 'YouTube and Meta'
};

// Product/service options mapping
const productLabels: Record<string, string> = {
  'ecommerce': 'E-commerce/Online Retail',
  'fmcg': 'FMCG (Fast Moving Consumer Goods)',
  'd2c_beauty': 'D2C Beauty',
  'fintech': 'FinTech'
};

// Objective options mapping
const objectiveLabels: Record<string, string> = {
  'awareness': 'Brand Awareness',
  'consideration': 'Consideration',
  'sales_lead_gen': 'Sales/Lead Generation'
};

// Audience options mapping
const audienceLabels: Record<string, string> = {
  'india_inmarket_shoppers': 'India - In-Market Shoppers',
  'india_affinity_shoppers': 'India - Affinity Shoppers', 
  'us_inmarket_shoppers': 'US - In-Market Shoppers',
  'us_affinity_shoppers': 'US - Affinity Shoppers',
  'india_inmarket_financial': 'India - In-Market Financial',
  'india_affinity_financial': 'India - Affinity Financial',
  'us_inmarket_financial': 'US - In-Market Financial',
  'us_affinity_financial': 'US - Affinity Financial'
};

// Timeframe options mapping
const timeframeLabels: Record<string, string> = {
  '1_2_weeks': '1-2 Weeks',
  '1_month': '1 Month',
  '2_3_months': '2-3 Months'
};

// Seasonal options mapping
const seasonalLabels: Record<string, string> = {
  'yes': 'Yes',
  'no': 'No', 
  'beyond_festive': 'Beyond Festive'
};

/**
 * Format budget value to include proper currency symbol and readable text
 */
export function formatBudget(budgetValue: string): string {
  return budgetLabels[budgetValue] || budgetValue || 'Not specified';
}

/**
 * Format platform selection to show readable platform names
 */
export function formatPlatforms(platforms: string[] | string): string {
  if (Array.isArray(platforms)) {
    return platforms.map(platform => platformLabels[platform] || formatText(platform)).join(", ");
  }
  return platformLabels[platforms] || formatText(platforms) || "Not specified";
}

/**
 * Format product/service value to readable text
 */
export function formatProduct(productValue: string): string {
  return productLabels[productValue] || formatText(productValue) || 'Not specified';
}

/**
 * Format objective value to readable text
 */
export function formatObjective(objectiveValue: string): string {
  return objectiveLabels[objectiveValue] || formatText(objectiveValue) || 'Not specified';
}

/**
 * Format audience value to readable text
 */
export function formatAudience(audienceValue: string): string {
  return audienceLabels[audienceValue] || formatText(audienceValue) || 'Not specified';
}

/**
 * Format timeframe value to readable text
 */
export function formatTimeframe(timeframeValue: string): string {
  return timeframeLabels[timeframeValue] || formatText(timeframeValue) || 'Not specified';
}

/**
 * Format seasonal values to readable text (handles multiple selections)
 */
export function formatSeasonal(seasonalValue: string): string {
  if (!seasonalValue) return 'Not specified';
  
  // Handle multiple selections separated by comma
  const values = seasonalValue.split(', ').map(val => val.trim());
  return values.map(value => seasonalLabels[value] || formatText(value)).join(', ');
}

/**
 * Generic function to convert underscore-separated text to readable format
 */
export function formatText(text: string): string {
  if (!text) return '';
  
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format any campaign data value using appropriate formatter
 */
export function formatCampaignValue(key: string, value: string): string {
  switch (key) {
    case 'budget':
      return formatBudget(value);
    case 'platforms':
      return formatPlatforms(value);
    case 'product':
      return formatProduct(value);
    case 'objective':
      return formatObjective(value);
    case 'audience':
      return formatAudience(value);
    case 'timeframe':
    case 'duration':
      return formatTimeframe(value);
    case 'seasonal':
    case 'season':
      return formatSeasonal(value);
    default:
      return formatText(value) || 'Not specified';
  }
}
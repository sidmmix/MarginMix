// Map industry values
export function mapIndustry(industry: string): string {
  switch (industry) {
    case 'ecommerce':
      return 'E-commerce';
    case 'fmcg':
      return 'Retail';
    case 'd2c_beauty':
      return 'Beauty & Personal Care';
    case 'fintech':
      return 'Financial Services';
    default:
      return industry;
  }
}

// Map Demographics (Audience) Values
export function mapDemographics(audience: string): {
  geo: string | null;
  behaviors?: string | null;
  interests?: string | null;
} {
  const result: {
    geo: string | null;
    behaviors?: string | null;
    interests?: string | null;
  } = {
    geo: null,
    behaviors: null,
    interests: null
  };

  if (audience.startsWith('india')) {
    result.geo = 'IN';
  } else if (audience.startsWith('us')) {
    result.geo = 'US';
  }

  if (audience.includes('inmarket')) {
    result.behaviors = 'Frequent Buyers';
  } else if (audience.includes('affinity')) {
    result.interests = 'Product Enthusiasts';
  } else if (audience.includes('financial')) {
    result.interests = 'Finance & Banking';
  }

  return result;
}

// Map Budget Values
export function mapBudget(budget: string): {
  budget_inr?: string;
  budget_usd?: string;
} {
  const result: {
    budget_inr?: string;
    budget_usd?: string;
  } = {};

  if (budget.startsWith('inr')) {
    switch (budget) {
      case 'inr_under_10l':
        result.budget_inr = '1000000';
        break;
      case 'inr_10_20l':
        result.budget_inr = '1000001-2000000';
        break;
      default:
        result.budget_inr = budget.toUpperCase().replace('INR_', '');
    }
  } else if (budget.startsWith('usd')) {
    switch (budget) {
      case 'usd_under_100k':
        result.budget_usd = '$0-100000';
        break;
      case 'usd_100_300k':
        result.budget_usd = '$100000-300000';
        break;
      case 'usd_300_800k':
        result.budget_usd = '$300000-800000';
        break;
      case 'usd_800_1500k':
        result.budget_usd = '$800000-1500000';
        break;
      case 'usd_above_1500k':
        result.budget_usd = '$1500000+';
        break;
      default:
        result.budget_usd = budget.replace('usd_', '$').replace('_', '-');
    }
  }

  return result;
}

// Map Seasonality Values
export function mapSeasonality(season: string): string {
  switch (season) {
    case 'only_festive':
      return 'Holiday Season (Q4)';
    case 'beyond_festive':
      return 'Non-Holiday Season (Q1-Q3)';
    default:
      return season;
  }
}

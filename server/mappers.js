// Map industry values
function mapIndustry(industry) {
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
function mapDemographics(audience) {
  const result = {
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
function mapBudget(budget) {
  const result = {};

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
      default:
        result.budget_usd = budget.toUpperCase().replace('USD_', '$');
    }
  }

  return result;
}

// Map Seasonality Values
function mapSeasonality(season) {
  switch (season) {
    case 'only_festive':
      return 'Holiday Season (Q4)';
    case 'beyond_festive':
      return 'Non-Holiday Season (Q1-Q3)';
    default:
      return season;
  }
}

module.exports = {
  mapIndustry,
  mapDemographics,
  mapBudget,
  mapSeasonality
};

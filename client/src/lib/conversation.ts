import type { Question, ConversationData } from "@shared/schema";

export const QUESTIONS: Question[] = [
  { 
    id: 'name', 
    question: "What's your name?", 
    type: 'text',
    placeholder: "Enter your name...",
    validation: { required: true, minLength: 2 }
  },
  { 
    id: 'company', 
    question: "What's your company/brand's name?", 
    type: 'text',
    placeholder: "Enter company name...",
    validation: { required: true, minLength: 2 }
  },
  { 
    id: 'product', 
    question: "What kind of product/service is this campaign promoting?", 
    type: 'single_choice',
    options: [
      { value: 'ecommerce', label: 'Ecommerce app/Superapp' },
      { value: 'fmcg', label: 'FMCG/CPG' },
      { value: 'd2c_beauty', label: 'D2C Beauty/Skincare/Personal Care/Haircare/Wellness' },
      { value: 'fintech', label: 'Fintech/Financial Services' }
    ],
    validation: { required: true }
  },
  { 
    id: 'platforms', 
    question: "Where do you want to deploy your digital media campaign?", 
    type: 'single_choice',
    options: [
      { value: 'youtube', label: 'YouTube' },
      { value: 'meta', label: 'Meta' },
      { value: 'both', label: 'Both' }
    ],
    validation: { required: true }
  },
  { 
    id: 'objective', 
    question: "What's the objective of your campaign?", 
    type: 'single_choice',
    options: [
      { value: 'awareness', label: 'Awareness' },
      { value: 'consideration', label: 'Consideration' },
      { value: 'sales_lead_gen', label: 'Sales/Lead Generation' }
    ],
    validation: { required: true }
  },
  { 
    id: 'audience', 
    question: "Define your target audience and geo location", 
    type: 'single_choice',
    options: [
      { value: 'india_inmarket_shoppers', label: '18–54, Male and Female, India Top 8 cities, InMarket Shoppers' },
      { value: 'india_affinity_shoppers', label: '18–54, Male and Female, India Top 8 cities, Affinity Shoppers' },
      { value: 'us_inmarket_shoppers', label: '18–54, Male and Female, US Metro Areas, InMarket Shoppers' },
      { value: 'us_affinity_shoppers', label: '18–54, Male and Female, US Metro Areas, Affinity Shoppers' },
      { value: 'india_inmarket_financial', label: '18–54, Male and Female, India Top 8 cities, InMarket Financial Services' },
      { value: 'india_affinity_financial', label: '18–54, Male and Female, India Top 8 cities, Affinity Financial Services' },
      { value: 'us_inmarket_financial', label: '18–54, Male and Female, US Metro Areas, InMarket Financial Services' },
      { value: 'us_affinity_financial', label: '18–54, Male and Female, US Metro Areas, Affinity Financial Services' }
    ],
    validation: { required: true }
  },
  { 
    id: 'timeframe', 
    question: "How long do you want to run the campaign?", 
    type: 'single_choice',
    options: [
      { value: '1_2_weeks', label: '1-2 weeks' },
      { value: '1_month', label: '1 month' },
      { value: '2_3_months', label: '2-3 months' }
    ],
    validation: { required: true }
  },
  { 
    id: 'season', 
    question: "Are you advertising for the festive season/holiday season only?", 
    type: 'single_choice',
    options: [
      { value: 'only_festive', label: 'Yes' },
      { value: 'beyond_festive', label: 'No, beyond holiday season' }
    ],
    validation: { required: true }
  },
  { 
    id: 'budget', 
    question: "What's your budget?", 
    type: 'single_choice',
    options: [
      { value: 'inr_under_10l', label: '< INR 10 lakhs' },
      { value: 'inr_10_20l', label: '10 lakhs to 20 lakhs' },
      { value: 'inr_20_40l', label: '20 lakhs to 40 lakhs' },
      { value: 'inr_40_80l', label: '40 lakhs to 80 lakhs' },
      { value: 'inr_80l_plus', label: '80 lakhs+' },
      { value: 'inr_2cr_plus', label: '2 crores+' },
      { value: 'usd_under_100k', label: '< US$ 100,000' },
      { value: 'usd_100_200k', label: 'US$ 100,000 to 200,000' },
      { value: 'usd_200_500k', label: 'US$ 200,000 to 500,000' },
      { value: 'usd_500_800k', label: 'US$ 500,000 to 800,000' },
      { value: 'usd_800_1500k', label: 'US$ 800,000 to 1,500,000' },
      { value: 'usd_1500_3000k', label: 'US$ 1,500,000 to 3,000,000' },
      { value: 'usd_3m_plus', label: 'US$ 3 mn+' },
      { value: 'usd_5m_plus', label: 'US$ 5 mn+' }
    ],
    validation: { required: true }
  }
];

export function validateAnswer(question: Question, answer: string): { isValid: boolean; error?: string } {
  if (!question.validation) {
    return { isValid: true };
  }

  const { required, minLength, maxLength } = question.validation;

  if (required && (!answer || answer.trim().length === 0)) {
    return { isValid: false, error: "This field is required" };
  }

  if (minLength && answer.length < minLength) {
    return { isValid: false, error: `Answer must be at least ${minLength} characters long` };
  }

  if (maxLength && answer.length > maxLength) {
    return { isValid: false, error: `Answer must be no more than ${maxLength} characters long` };
  }

  return { isValid: true };
}

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning!";
  if (hour >= 12 && hour < 17) return "Good afternoon!";
  return "Good evening!";
}

export function formatConversationSummary(data: ConversationData): string {
  const sections = [
    `Name: ${data.name || 'Not provided'}`,
    `Company: ${data.company || 'Not provided'}`,
    `Product/Service: ${data.product || 'Not provided'}`,
    `Platforms: ${data.platforms || 'Not provided'}`,
    `Objective: ${data.objective || 'Not provided'}`,
    `Target Audience: ${data.audience || 'Not provided'}`,
    `Timeframe: ${data.timeframe || 'Not provided'}`,
    `Season: ${data.season || 'Not provided'}`,
    `Budget: ${data.budget || 'Not provided'}`,
  ];

  return sections.join('\n');
}

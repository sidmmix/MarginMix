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
    type: 'text',
    placeholder: "Describe your product/service...",
    validation: { required: true, minLength: 10 }
  },
  { 
    id: 'platforms', 
    question: "Where do you want to deploy your digital media campaign?", 
    type: 'platform',
    placeholder: "Select your preferred platforms...",
    validation: { required: true }
  },
  { 
    id: 'objective', 
    question: "What's the objective of your campaign?", 
    type: 'text',
    placeholder: "E.g., Brand awareness, Lead generation, Sales...",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'audience', 
    question: "Define your target audience and geo location", 
    type: 'text',
    placeholder: "E.g., Women 25-45, United States, interested in fashion...",
    validation: { required: true, minLength: 10 }
  },
  { 
    id: 'budget', 
    question: "What's your budget?", 
    type: 'text',
    placeholder: "E.g., $10,000 or $10K...",
    validation: { required: true, minLength: 2 }
  },
  { 
    id: 'duration', 
    question: "How long do you want to run the campaign? Give specific dates.", 
    type: 'text',
    placeholder: "E.g., March 1 - March 31, 2024...",
    validation: { required: true, minLength: 5 }
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
    `Budget: ${data.budget || 'Not provided'}`,
    `Duration: ${data.duration || 'Not provided'}`,
  ];

  return sections.join('\n');
}

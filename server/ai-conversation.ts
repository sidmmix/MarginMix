import OpenAI from "openai";

// Security: Validate OpenAI API key exists
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ConversationContext {
  userResponses: Record<string, any>;
  currentStep: number;
  sessionData: any;
  userProfile?: {
    industry?: string;
    experienceLevel?: string;
    previousCampaigns?: string[];
  };
}

export interface PredictiveResponse {
  suggestions: string[];
  nextQuestionPreview?: string;
  contextualHints: string[];
  validationFeedback?: string;
}

export async function generatePredictiveResponse(
  currentQuestion: any,
  userInput: string,
  context: ConversationContext
): Promise<PredictiveResponse> {
  try {
    const prompt = `You are an expert digital marketing strategist helping users create campaign briefs. 

Current Question: "${currentQuestion.question}"
User's Current Input: "${userInput}"
Previous Responses: ${JSON.stringify(context.userResponses)}
Current Step: ${context.currentStep + 1} of 8

Based on the user's input and context, provide:
1. Smart suggestions to complete or improve their answer (3-5 options)
2. Contextual hints that might help them think deeper
3. Brief validation feedback if their input seems incomplete or could be enhanced
4. A preview of what the next question might focus on

Respond in JSON format with this structure:
{
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "contextualHints": ["hint1", "hint2"],
  "validationFeedback": "brief feedback or null",
  "nextQuestionPreview": "preview of next topic or null"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      suggestions: result.suggestions || [],
      nextQuestionPreview: result.nextQuestionPreview || undefined,
      contextualHints: result.contextualHints || [],
      validationFeedback: result.validationFeedback || undefined,
    };
  } catch (error) {
    console.error("Error generating predictive response:", error);
    return {
      suggestions: [],
      contextualHints: [],
    };
  }
}

export async function generateDynamicQuestion(
  context: ConversationContext,
  baseQuestions: any[]
): Promise<any> {
  try {
    if (context.currentStep >= baseQuestions.length) {
      return null;
    }

    const baseQuestion = baseQuestions[context.currentStep];
    const previousResponses = context.userResponses;

    const prompt = `You are adapting a campaign planning question based on user's previous responses.

Base Question: "${baseQuestion.question}"
User's Previous Responses: ${JSON.stringify(previousResponses)}

Adapt this question to be more personalized and relevant based on their previous answers. Make it feel like a natural conversation flow. Keep the same question ID and type.

Respond in JSON format:
{
  "question": "adapted question text",
  "placeholder": "updated placeholder text",
  "contextualNote": "brief note about why this question matters for their specific case"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      ...baseQuestion,
      question: result.question || baseQuestion.question,
      placeholder: result.placeholder || baseQuestion.placeholder,
      contextualNote: result.contextualNote,
    };
  } catch (error) {
    console.error("Error generating dynamic question:", error);
    return baseQuestions[context.currentStep];
  }
}

export async function validateAndEnhanceAnswer(
  question: any,
  answer: string,
  context: ConversationContext
): Promise<{
  isValid: boolean;
  enhancedAnswer?: string;
  suggestions: string[];
  qualityScore: number;
}> {
  try {
    console.log(`[DEBUG] Validating answer for question type: ${question.type}, ID: ${question.id}`);
    console.log(`[DEBUG] Answer received: "${answer}"`);
    console.log(`[DEBUG] Has options:`, !!question.options);
    
    // Skip AI processing for predefined option selections
    if (question.options && (question.type === 'single_choice' || question.type === 'multiple_choice')) {
      const validOptionValues = question.options.map((opt: any) => opt.value);
      const answerValues = answer.split(', ').map(v => v.trim());
      
      console.log(`[DEBUG] Valid option values:`, validOptionValues);
      console.log(`[DEBUG] Answer values:`, answerValues);
      
      // Check if all answer values are valid predefined options
      const allValidOptions = answerValues.every(value => validOptionValues.includes(value));
      
      console.log(`[DEBUG] All values are valid options:`, allValidOptions);
      
      if (allValidOptions) {
        console.log(`[DEBUG] Skipping AI processing for predefined option selection`);
        // Return the original answer without AI processing for predefined selections
        return {
          isValid: true,
          enhancedAnswer: undefined, // Keep original answer as-is
          suggestions: [],
          qualityScore: 8, // High score for valid predefined selections
        };
      }
    }

    console.log(`[DEBUG] Proceeding with AI validation for free-form answer`);

    // Only process free-form text answers through AI
    const prompt = `You are validating and enhancing a user's answer to a campaign planning question.

Question: "${question.question}"
User's Answer: "${answer}"
Context: ${JSON.stringify(context.userResponses)}

Evaluate the answer and provide:
1. Whether it's valid and complete (boolean)
2. An enhanced version that adds strategic context (if needed)
3. Specific suggestions for improvement
4. A quality score from 1-10 (10 being comprehensive and strategic)

Respond in JSON format:
{
  "isValid": true/false,
  "enhancedAnswer": "enhanced version or null",
  "suggestions": ["improvement1", "improvement2"],
  "qualityScore": 1-10
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      isValid: result.isValid !== false,
      enhancedAnswer: result.enhancedAnswer || undefined,
      suggestions: result.suggestions || [],
      qualityScore: result.qualityScore || 5,
    };
  } catch (error) {
    console.error("Error validating answer:", error);
    return {
      isValid: true,
      suggestions: [],
      qualityScore: 5,
    };
  }
}

export async function generateContextualInsights(
  context: ConversationContext
): Promise<{
  insights: string[];
  recommendations: string[];
  potentialChallenges: string[];
}> {
  try {
    const prompt = `Based on the user's campaign responses so far, provide strategic insights.

User Responses: ${JSON.stringify(context.userResponses)}
Progress: ${context.currentStep + 1}/8 questions completed

Generate:
1. Key insights about their campaign strategy
2. Strategic recommendations to consider
3. Potential challenges they should prepare for

Respond in JSON format:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "potentialChallenges": ["challenge1", "challenge2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      potentialChallenges: result.potentialChallenges || [],
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      insights: [],
      recommendations: [],
      potentialChallenges: [],
    };
  }
}
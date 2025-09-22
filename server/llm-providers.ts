/**
 * LLM Provider Abstraction Layer
 * 
 * This module provides a flexible abstraction for working with different LLM providers
 * including Anthropic Claude, Google Gemini, OpenAI, and local models via Ollama.
 * Designed for easy switching between providers and RAG implementations.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Provider configuration types
export interface LLMConfig {
  provider: 'anthropic' | 'google' | 'openai' | 'ollama';
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseURL?: string; // For Ollama or custom endpoints
}

export interface ProviderCosts {
  inputTokenPrice: number;  // Price per 1K input tokens
  outputTokenPrice: number; // Price per 1K output tokens
  currency: string;
}

export interface ProviderInfo {
  name: string;
  description: string;
  strengths: string[];
  costs: ProviderCosts;
  maxContextLength: number;
  supportsStreaming: boolean;
}

// Message types for consistent interface
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

// Abstract provider interface
export abstract class LLMProvider {
  protected config: LLMConfig;
  protected model: BaseChatModel;

  constructor(config: LLMConfig) {
    this.config = config;
    this.model = this.initializeModel();
  }

  abstract initializeModel(): BaseChatModel;
  abstract getProviderInfo(): ProviderInfo;

  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const langchainMessages = this.convertToLangchainMessages(messages);
      const response = await this.model.invoke(langchainMessages);
      
      return {
        content: response.content as string,
        usage: response.usage_metadata ? {
          inputTokens: response.usage_metadata.input_tokens || 0,
          outputTokens: response.usage_metadata.output_tokens || 0,
          totalTokens: response.usage_metadata.total_tokens || 0
        } : undefined,
        metadata: response.additional_kwargs
      };
    } catch (error) {
      console.error(`Error with ${this.config.provider} provider:`, error);
      throw new Error(`LLM provider error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected convertToLangchainMessages(messages: LLMMessage[]): BaseMessage[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          // For assistant messages, we'd use AIMessage but it's typically not needed for inputs
          return new HumanMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }
}

// Anthropic Claude Provider
export class AnthropicProvider extends LLMProvider {
  initializeModel(): BaseChatModel {
    return new ChatAnthropic({
      model: this.config.modelName || "claude-3-5-sonnet-20241022",
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens || 4096,
      anthropicApiKey: this.config.apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: "Anthropic Claude",
      description: "Advanced reasoning and analysis with strong safety measures",
      strengths: [
        "Excellent reasoning and analysis",
        "Strong safety and alignment",
        "Good at following complex instructions",
        "High context understanding"
      ],
      costs: {
        inputTokenPrice: 3.0, // $3 per 1M tokens for Claude 3.5 Sonnet
        outputTokenPrice: 15.0, // $15 per 1M tokens
        currency: "USD"
      },
      maxContextLength: 200000,
      supportsStreaming: true
    };
  }
}

// Google Gemini Provider
export class GoogleProvider extends LLMProvider {
  initializeModel(): BaseChatModel {
    return new ChatGoogleGenerativeAI({
      model: this.config.modelName || "gemini-1.5-pro",
      temperature: this.config.temperature || 0.7,
      maxOutputTokens: this.config.maxTokens || 4096,
      apiKey: this.config.apiKey || process.env.GOOGLE_API_KEY,
    });
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: "Google Gemini",
      description: "Multimodal AI with strong reasoning and code generation",
      strengths: [
        "Multimodal capabilities (text, image, video)",
        "Strong code generation",
        "Good reasoning abilities",
        "Competitive pricing"
      ],
      costs: {
        inputTokenPrice: 1.25, // $1.25 per 1M tokens for Gemini 1.5 Pro
        outputTokenPrice: 5.0, // $5 per 1M tokens
        currency: "USD"
      },
      maxContextLength: 128000,
      supportsStreaming: true
    };
  }
}

// OpenAI Provider (for compatibility)
export class OpenAIProvider extends LLMProvider {
  initializeModel(): BaseChatModel {
    return new ChatOpenAI({
      model: this.config.modelName || "gpt-4o-mini",
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens || 4096,
      openAIApiKey: this.config.apiKey || process.env.OPENAI_API_KEY,
    });
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: "OpenAI GPT",
      description: "Versatile language model with broad capabilities",
      strengths: [
        "Broad general knowledge",
        "Good creative writing",
        "Strong function calling",
        "Wide ecosystem support"
      ],
      costs: {
        inputTokenPrice: 0.15, // $0.15 per 1M tokens for GPT-4o mini
        outputTokenPrice: 0.6, // $0.60 per 1M tokens
        currency: "USD"
      },
      maxContextLength: 128000,
      supportsStreaming: true
    };
  }
}

// Ollama Provider (for local models)
export class OllamaProvider extends LLMProvider {
  initializeModel(): BaseChatModel {
    return new ChatOpenAI({
      model: this.config.modelName || "llama3.1",
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens || 4096,
      openAIApiKey: "ollama", // Dummy key for Ollama
      configuration: {
        baseURL: this.config.baseURL || "http://localhost:11434/v1",
      }
    });
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: "Ollama (Local)",
      description: "Self-hosted local models for privacy and cost control",
      strengths: [
        "Complete privacy",
        "No API costs",
        "Offline capability",
        "Customizable models"
      ],
      costs: {
        inputTokenPrice: 0, // No API costs
        outputTokenPrice: 0,
        currency: "USD"
      },
      maxContextLength: 32768, // Depends on model
      supportsStreaming: true
    };
  }
}

// Provider Factory
export class LLMProviderFactory {
  static createProvider(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'google':
        return new GoogleProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  static getAllProviderInfo(): Record<string, ProviderInfo> {
    const anthropic = new AnthropicProvider({ provider: 'anthropic', modelName: '' });
    const google = new GoogleProvider({ provider: 'google', modelName: '' });
    const openai = new OpenAIProvider({ provider: 'openai', modelName: '' });
    const ollama = new OllamaProvider({ provider: 'ollama', modelName: '' });

    return {
      anthropic: anthropic.getProviderInfo(),
      google: google.getProviderInfo(),
      openai: openai.getProviderInfo(),
      ollama: ollama.getProviderInfo()
    };
  }
}

// LLM Service Manager
export class LLMService {
  private provider: LLMProvider;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.provider = LLMProviderFactory.createProvider(config);
  }

  async generateCampaignBrief(sessionData: Record<string, any>): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are an expert digital marketing strategist. Create a comprehensive campaign brief based on the provided information. Structure your response with clear sections: Executive Summary, Target Audience Analysis, Key Messages, Channel Strategy, Budget Recommendations, and Success Metrics.`
      },
      {
        role: 'user',
        content: `Create a digital marketing campaign brief based on this information: ${JSON.stringify(sessionData, null, 2)}`
      }
    ];

    const response = await this.provider.generateResponse(messages);
    return response.content;
  }

  async enhanceUserResponse(question: string, answer: string, context: Record<string, any>): Promise<{
    enhancedAnswer: string;
    suggestions: string[];
    qualityScore: number;
  }> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a marketing strategist helping users improve their campaign planning responses. Enhance the given answer and provide suggestions. Respond with JSON format: {"enhancedAnswer": "improved version", "suggestions": ["suggestion1", "suggestion2"], "qualityScore": 8}`
      },
      {
        role: 'user',
        content: `Question: ${question}\nAnswer: ${answer}\nContext: ${JSON.stringify(context)}`
      }
    ];

    const response = await this.provider.generateResponse(messages);
    
    try {
      const parsed = JSON.parse(response.content);
      return {
        enhancedAnswer: parsed.enhancedAnswer || answer,
        suggestions: parsed.suggestions || [],
        qualityScore: parsed.qualityScore || 7
      };
    } catch {
      return {
        enhancedAnswer: answer,
        suggestions: [],
        qualityScore: 7
      };
    }
  }

  getProviderInfo(): ProviderInfo {
    return this.provider.getProviderInfo();
  }

  switchProvider(newConfig: LLMConfig): void {
    this.config = newConfig;
    this.provider = LLMProviderFactory.createProvider(newConfig);
  }
}

// Default configuration helper
export const createLLMConfig = (
  provider: LLMConfig['provider'],
  overrides: Partial<LLMConfig> = {}
): LLMConfig => {
  const defaults: Record<LLMConfig['provider'], Partial<LLMConfig>> = {
    anthropic: {
      modelName: "claude-3-5-sonnet-20241022",
      temperature: 0.7,
      maxTokens: 4096
    },
    google: {
      modelName: "gemini-1.5-pro",
      temperature: 0.7,
      maxTokens: 4096
    },
    openai: {
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096
    },
    ollama: {
      modelName: "llama3.1",
      temperature: 0.7,
      maxTokens: 4096,
      baseURL: "http://localhost:11434/v1"
    }
  };

  return {
    provider,
    ...defaults[provider],
    ...overrides
  };
};
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceSelection } from "@/components/choice-selection";
import { 
  Brain, 
  User, 
  Send, 
  CheckCircle,
  BarChart3,
  Download,
  Sparkles,
  Target,
  DollarSign,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ConversationSession, Question, ConversationData, CampaignBrief } from "@shared/schema";
import { 
  formatBudget, 
  formatPlatforms, 
  formatProduct, 
  formatObjective, 
  formatAudience, 
  formatTimeframe, 
  formatSeasonal,
  formatText
} from "@/lib/format-utils";

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  session: ConversationSession | undefined;
  sessionId: string | null;
  questions: Question[];
  greeting: string;
  onComplete: () => void;
}

export function ChatInterface({ session, sessionId, questions, greeting, onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showChoices, setShowChoices] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const currentQuestion = session ? questions[session.currentStep] : questions[0];
  const conversationData = session?.sessionData as ConversationData || {};

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize messages when session and questions are available
  useEffect(() => {
    if (questions.length === 0 || !sessionId) return;

    const newMessages: ChatMessage[] = [
      {
        id: "greeting",
        type: "ai",
        content: greeting,
        timestamp: new Date(),
      }
    ];

    // Reconstruct conversation from session data
    if (session && session.currentStep > 0) {
      for (let i = 0; i < session.currentStep; i++) {
        const question = questions[i];
        const answer = conversationData[question.id as keyof ConversationData];
        
        if (question && answer) {
          newMessages.push(
            {
              id: `q-${i}`,
              type: "ai",
              content: question.question,
              timestamp: new Date(),
            },
            {
              id: `a-${i}`,
              type: "user",
              content: answer,
              timestamp: new Date(),
            }
          );
        }
      }
    }

    // Add current question if not completed
    if (session?.isCompleted !== "true" && currentQuestion) {
      newMessages.push({
        id: `current-q`,
        type: "ai",
        content: currentQuestion.question,
        timestamp: new Date(),
      });
      setShowChoices(false); // Always show textarea for new question types
    }

    setMessages(newMessages);
  }, [sessionId, session?.currentStep, session?.isCompleted, questions.length]);

  // Handle completion callback - trigger summary directly when conversation is complete
  useEffect(() => {
    if (session?.isCompleted === "true" && session?.sessionData) {
      onComplete();
    }
  }, [session?.isCompleted, session?.sessionData]);

  // Auto-focus textarea for seamless Q&A flow
  useEffect(() => {
    if (!showChoices && textareaRef.current && currentQuestion && session?.isCompleted !== "true") {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showChoices, session?.currentStep, session?.isCompleted]);

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: (answer: string) => 
      apiRequest("POST", `/api/conversation/${sessionId}/respond`, {
        answer,
        questionId: currentQuestion?.id
      }),
    onSuccess: async (response) => {
      const result = await response.json();
      
      // Add user message
      setMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        type: "user",
        content: inputValue,
        timestamp: new Date(),
      }]);

      // Handle next question (completion is handled by useEffect)
      if (result.nextQuestion && !result.isComplete) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: result.nextQuestion.question,
          timestamp: new Date(),
        }]);
        setShowChoices(false); // Always show textarea for new question types
      }

      setInputValue("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', sessionId] });
      
      // Refresh insights only after every few questions for better flow
      if ((session?.currentStep || 0) % 2 === 0) {
        queryClient.invalidateQueries({ queryKey: [`/api/conversation/${sessionId}/insights`] });
      }
    },
    onError: (error) => {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Choice selection handler
  const handleChoiceSelection = (value: string | string[]) => {
    const answer = Array.isArray(value) ? value.join(', ') : value;
    submitResponseMutation.mutate(answer);
    setShowChoices(false);
  };

  // Regular input submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || submitResponseMutation.isPending) return;
    submitResponseMutation.mutate(inputValue.trim());
  };

  // Generate campaign brief
  const generateBriefMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/conversation/${sessionId}/brief`),
    onSuccess: async (response) => {
      const brief = await response.json();
      setCampaignBrief(brief);
      
      // Auto-download the brief
      setTimeout(() => {
        const geoTargeting = brief.geoTargeting as any || {};
        const demographics = brief.demographics as any || {};
        const content = `Campaign Brief

Brief Title: ${brief.briefTitle || 'Not specified'}
Industry Vertical: ${brief.industryVertical || 'Not specified'}
Geographic Targeting: ${JSON.stringify(geoTargeting)}
Demographics: ${JSON.stringify(demographics)}
Affinity Buckets: ${(brief.affinityBuckets as string[] || []).join(', ') || 'Not specified'}
In-Market Segments: ${(brief.inMarketSegments as string[] || []).join(', ') || 'Not specified'}

AI Insights:
Budget Allocation: ${JSON.stringify((brief.aiInsights as any)?.budgetAllocation || {}, null, 2)}
Platform Strategies: ${JSON.stringify((brief.aiInsights as any)?.platformStrategies || {}, null, 2)}
KPIs: ${((brief.aiInsights as any)?.kpis || []).join(", ")}
Recommendations: 
${((brief.aiInsights as any)?.recommendations || []).map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}
`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${brief.briefTitle || 'campaign'}-brief.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000); // 1 second delay to let the UI update
    },
    onError: (error) => {
      console.error("Error generating brief:", error);
      toast({
        title: "Error",
        description: "Failed to generate campaign brief. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadBrief = () => {
    if (!campaignBrief) return;
    
    const geoTargeting = campaignBrief.geoTargeting as any || {};
    const demographics = campaignBrief.demographics as any || {};
    const content = `Campaign Brief

Brief Title: ${campaignBrief.briefTitle || 'Not specified'}
Industry Vertical: ${campaignBrief.industryVertical || 'Not specified'}
Geographic Targeting: ${JSON.stringify(geoTargeting)}
Demographics: ${JSON.stringify(demographics)}
Affinity Buckets: ${(campaignBrief.affinityBuckets as string[] || []).join(', ') || 'Not specified'}
In-Market Segments: ${(campaignBrief.inMarketSegments as string[] || []).join(', ') || 'Not specified'}

AI Insights:
Budget Allocation: ${JSON.stringify((campaignBrief.aiInsights as any)?.budgetAllocation || {}, null, 2)}
Platform Strategies: ${JSON.stringify((campaignBrief.aiInsights as any)?.platformStrategies || {}, null, 2)}
KPIs: ${((campaignBrief.aiInsights as any)?.kpis || []).join(", ")}
Recommendations: 
${((campaignBrief.aiInsights as any)?.recommendations || []).map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaignBrief.briefTitle || 'campaign'}-brief.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Completion screen
  if (isComplete && !campaignBrief) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Campaign Brief Complete!</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Great! I've gathered all the information needed for your media campaign. 
          Let me generate your comprehensive campaign brief with AI-powered insights.
        </p>
        <Button 
          onClick={() => generateBriefMutation.mutate()}
          disabled={generateBriefMutation.isPending}
          size="lg"
          data-testid="button-generate-brief"
          className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          {generateBriefMutation.isPending ? "Generating..." : "Generate Campaign Brief"}
        </Button>
      </div>
    );
  }

  // Brief results screen
  if (campaignBrief) {
    return (
      <div className="space-y-8 p-6">
        {/* Hero Section */}
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
            </div>
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
            Your Campaign Brief is Ready!
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive media planning brief with AI-powered insights and strategic recommendations
          </p>
        </div>

        {/* Enhanced Brief Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white p-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Campaign Brief Preview</h3>
            <p className="text-blue-100">AI-Enhanced Strategy & Insights</p>
          </div>

          {/* Content */}
          <div className="p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="space-y-6">
              {/* Basic Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Target className="h-5 w-5" />
                  Campaign Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Brief Title</span>
                    <span className="text-gray-900 dark:text-white font-medium">{campaignBrief.briefTitle || 'Not specified'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Industry</span>
                    <span className="text-gray-900 dark:text-white font-medium">{campaignBrief.industryVertical || 'Not specified'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Primary Markets</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {((campaignBrief.geoTargeting as any)?.primary_markets || []).join(', ') || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Demographics</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {((campaignBrief.demographics as any)?.age_range || '') + ' | ' + ((campaignBrief.demographics as any)?.hhi_segment || '') || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget & Investment Strategy */}
              {(campaignBrief.aiInsights as any)?.generatedBrief?.budget_details && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <DollarSign className="h-5 w-5" />
                    Budget & Investment Strategy
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Budget</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.budget_details?.total_budget || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Flight Duration</span>
                      <span className="text-gray-900 dark:text-white">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.budget_details?.flight_duration || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Allocation Strategy</span>
                      <span className="text-gray-900 dark:text-white">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.budget_details?.allocation_strategy || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Objectives */}
              {(campaignBrief.aiInsights as any)?.generatedBrief?.campaign_objectives && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Target className="h-5 w-5" />
                    Campaign Objectives & KPIs
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Primary KPI</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.campaign_objectives?.primary_kpi || 'Not specified'}
                      </span>
                    </div>
                    {(campaignBrief.aiInsights as any)?.generatedBrief?.campaign_objectives?.secondary_kpis && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Secondary KPIs</span>
                        <ul className="list-disc list-inside text-gray-900 dark:text-white text-sm space-y-1">
                          {((campaignBrief.aiInsights as any)?.generatedBrief?.campaign_objectives?.secondary_kpis || []).map((kpi: string, idx: number) => (
                            <li key={idx}>{kpi}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* YouTube Strategy */}
              {(campaignBrief.aiInsights as any)?.generatedBrief?.youtube_strategy && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Globe className="h-5 w-5" />
                    YouTube Strategy
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.youtube_strategy?.recommended ? '✅ Recommended' : '❌ Not Recommended'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rationale</span>
                      <span className="text-gray-900 dark:text-white text-sm">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.youtube_strategy?.rationale || 'Not specified'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Est. CPM</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {(campaignBrief.aiInsights as any)?.generatedBrief?.youtube_strategy?.estimated_cpm || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Est. Monthly Impressions</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {(campaignBrief.aiInsights as any)?.generatedBrief?.youtube_strategy?.estimated_impressions || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    {(campaignBrief.aiInsights as any)?.generatedBrief?.youtube_strategy?.benchmark_source && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          Source: {(campaignBrief.aiInsights as any)?.generatedBrief?.youtube_strategy?.benchmark_source}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Meta Strategy */}
              {(campaignBrief.aiInsights as any)?.generatedBrief?.meta_strategy && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Globe className="h-5 w-5" />
                    Meta (Facebook/Instagram) Strategy
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.meta_strategy?.recommended ? '✅ Recommended' : '❌ Not Recommended'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rationale</span>
                      <span className="text-gray-900 dark:text-white text-sm">
                        {(campaignBrief.aiInsights as any)?.generatedBrief?.meta_strategy?.rationale || 'Not specified'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Est. CPM</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {(campaignBrief.aiInsights as any)?.generatedBrief?.meta_strategy?.estimated_cpm || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Est. Monthly Impressions</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {(campaignBrief.aiInsights as any)?.generatedBrief?.meta_strategy?.estimated_impressions || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    {(campaignBrief.aiInsights as any)?.generatedBrief?.meta_strategy?.benchmark_source && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          Source: {(campaignBrief.aiInsights as any)?.generatedBrief?.meta_strategy?.benchmark_source}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Strategic Recommendations */}
              {((campaignBrief.aiInsights as any)?.recommendations || []).length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-700">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Brain className="h-5 w-5" />
                    AI Strategic Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {((campaignBrief.aiInsights as any)?.recommendations || []).map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={downloadBrief} variant="outline" size="lg" className="flex-1 h-12">
            <Download className="mr-2 h-5 w-5" />
            Download Brief
          </Button>
          <Button onClick={onComplete} size="lg" className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            View Full Campaign Summary
          </Button>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="flex flex-col h-full p-6">
      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {(session?.currentStep || 0) + 1} of {questions.length}</span>
          <span>{Math.round(((session?.currentStep || 0) + 1) / questions.length * 100)}% complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((session?.currentStep || 0) + 1) / questions.length * 100}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[400px]">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0">
                {message.type === 'ai' ? (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className={`rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {showChoices ? (
        <ChoiceSelection question={currentQuestion} onSelect={handleChoiceSelection} />
      ) : (
        <div className="space-y-3">
          {/* Regular Input */}
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
            placeholder={currentQuestion?.placeholder || "Type your answer..."}
            className={`min-h-[100px] resize-none ${submitResponseMutation.isPending ? "opacity-50" : ""}`}
            disabled={submitResponseMutation.isPending}
            data-testid="input-answer"
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={!inputValue.trim() || submitResponseMutation.isPending}
              className="min-w-[120px]"
            >
              {submitResponseMutation.isPending ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Continue
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
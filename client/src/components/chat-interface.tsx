import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformSelection } from "@/components/platform-selection";
import { 
  Brain, 
  User, 
  Send, 
  CheckCircle,
  BarChart3,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ConversationSession, Question, ConversationData, CampaignBrief } from "@shared/schema";

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
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        content: `${greeting} 👋 I'm here to help you create a comprehensive media plan brief. This will take about 5 minutes and I'll ask you 8 key questions to understand your campaign needs.`,
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

    // Handle completion or add current question
    if (session?.isCompleted === "true") {
      setIsComplete(true);
    } else if (currentQuestion) {
      newMessages.push({
        id: `current-q`,
        type: "ai",
        content: currentQuestion.question,
        timestamp: new Date(),
      });
      setShowPlatforms(currentQuestion.type === 'platform');
    }

    setMessages(newMessages);
  }, [sessionId, session?.currentStep, session?.isCompleted, questions.length]);

  // Handle completion callback
  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete]);

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

      // Handle completion or next question
      if (result.isComplete) {
        setIsComplete(true);
      } else if (result.nextQuestion) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: result.nextQuestion.question,
          timestamp: new Date(),
        }]);
        setShowPlatforms(result.nextQuestion.type === 'platform');
      }

      setInputValue("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', sessionId] });
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

  // Platform selection handler
  const handlePlatformSelection = (platform: string) => {
    submitResponseMutation.mutate(platform);
    setShowPlatforms(false);
  };

  // Regular input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || submitResponseMutation.isPending) return;
    submitResponseMutation.mutate(inputValue.trim());
  };

  // Generate campaign brief
  const generateBriefMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/conversation/${sessionId}/brief`),
    onSuccess: async (response) => {
      const brief = await response.json();
      setCampaignBrief(brief);
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
    
    const content = `Campaign Brief

Client: ${campaignBrief.clientName}
Campaign: ${campaignBrief.campaignName}
Target Audience: ${campaignBrief.targetAudience}
Budget: ${campaignBrief.budget}
Platforms: ${campaignBrief.platforms}
Objectives: ${campaignBrief.objectives}
Timeline: ${campaignBrief.timeline}
Key Messages: ${campaignBrief.keyMessages}

AI Insights:
Budget Allocation: ${JSON.stringify((campaignBrief.aiInsights as any)?.budgetAllocation || {}, null, 2)}
Platform Strategies: ${JSON.stringify((campaignBrief.aiInsights as any)?.platformStrategies || {}, null, 2)}
KPIs: ${((campaignBrief.aiInsights as any)?.kpis || []).join(", ")}
Recommendations: 
${((campaignBrief.aiInsights as any)?.recommendations || []).map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}

Estimated Reach: ${(campaignBrief.aiInsights as any)?.estimatedReach || 'Not available'}
Estimated CPM: ${(campaignBrief.aiInsights as any)?.estimatedCPM || 'Not available'}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaignBrief.campaignName}-brief.txt`;
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
      <div className="space-y-6 p-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your Campaign Brief is Ready!</h2>
          <p className="text-muted-foreground">
            Here's your comprehensive media planning brief with AI-powered insights
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Campaign Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Client:</strong> {campaignBrief.clientName}</div>
                <div><strong>Campaign:</strong> {campaignBrief.campaignName}</div>
                <div><strong>Budget:</strong> {campaignBrief.budget}</div>
                <div><strong>Timeline:</strong> {campaignBrief.timeline}</div>
                <div className="md:col-span-2"><strong>Target Audience:</strong> {campaignBrief.targetAudience}</div>
                <div className="md:col-span-2"><strong>Platforms:</strong> {campaignBrief.platforms}</div>
                <div className="md:col-span-2"><strong>Objectives:</strong> {campaignBrief.objectives}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">AI-Powered Insights</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Estimated Reach:</strong> {(campaignBrief.aiInsights as any)?.estimatedReach || 'Not available'}
                </div>
                <div>
                  <strong>Estimated CPM:</strong> {(campaignBrief.aiInsights as any)?.estimatedCPM || 'Not available'}
                </div>
                <div>
                  <strong>Key Recommendations:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {((campaignBrief.aiInsights as any)?.recommendations || []).map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={downloadBrief} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download Brief
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/auth'} className="flex-1">
            Get Full Media Planning Platform
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
      {showPlatforms ? (
        <PlatformSelection onSelect={handlePlatformSelection} />
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={currentQuestion?.placeholder || "Type your answer..."}
            disabled={submitResponseMutation.isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={!inputValue.trim() || submitResponseMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
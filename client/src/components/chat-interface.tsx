import { useState, useEffect, useRef, useMemo } from "react";
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
  ArrowLeft, 
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
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Memoize messages to prevent infinite loops
  const reconstructedMessages = useMemo(() => {
    if (questions.length === 0) return [];

    const baseTimestamp = new Date('2024-01-01'); // Use fixed timestamp to prevent re-renders
    const messages: ChatMessage[] = [
      {
        id: "greeting",
        type: "ai",
        content: `${greeting} 👋 I'm here to help you create a comprehensive media plan brief. This will take about 5 minutes and I'll ask you 8 key questions to understand your campaign needs.`,
        timestamp: baseTimestamp,
      }
    ];

    // If we have a session with previous steps, reconstruct the conversation
    if (session && session.currentStep > 0) {
      // Add previous Q&A pairs
      for (let i = 0; i < session.currentStep; i++) {
        const question = questions[i];
        const answer = conversationData[question.id as keyof ConversationData];
        
        if (question && answer) {
          messages.push(
            {
              id: `question-${question.id}-${i}`,
              type: "ai",
              content: question.question,
              timestamp: new Date(baseTimestamp.getTime() + i * 1000),
            },
            {
              id: `answer-${question.id}-${i}`,
              type: "user",
              content: answer,
              timestamp: new Date(baseTimestamp.getTime() + i * 1000 + 500),
            }
          );
        }
      }
    }

    // Add current question if not complete and session is not completed
    if (currentQuestion && session?.isCompleted !== "true") {
      messages.push({
        id: `question-${currentQuestion.id}-current`,
        type: "ai",
        content: currentQuestion.question,
        timestamp: new Date(baseTimestamp.getTime() + (session?.currentStep || 0) * 1000),
      });
    }

    return messages;
  }, [questions, session, conversationData, currentQuestion, greeting]);

  // Set messages and handle completion
  useEffect(() => {
    setMessages(reconstructedMessages);
    
    // Handle platform selection
    if (currentQuestion?.type === 'platform') {
      setShowPlatforms(true);
    } else {
      setShowPlatforms(false);
    }

    // Handle completion
    if (session?.isCompleted === "true" && !isComplete) {
      setIsComplete(true);
      onComplete();
    }
  }, [reconstructedMessages, currentQuestion, session, isComplete, onComplete]);

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
        id: `answer-${currentQuestion?.id}`,
        type: "user",
        content: inputValue,
        timestamp: new Date(),
      }]);

      setInputValue("");
      setShowPlatforms(false);

      // Check if complete
      if (result.isComplete) {
        setIsComplete(true);
        onComplete();
        generateBriefMutation.mutate();
      } else if (result.nextQuestion) {
        // Add next question
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `question-${result.nextQuestion.id}`,
            type: "ai",
            content: result.nextQuestion.question,
            timestamp: new Date(),
          }]);
          setShowPlatforms(result.nextQuestion.type === 'platform');
        }, 1000);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/conversation", sessionId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Go back mutation
  const goBackMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/conversation/${sessionId}/back`),
    onSuccess: async (response) => {
      const result = await response.json();
      
      // Rebuild messages up to current step
      const newMessages: ChatMessage[] = [
        {
          id: "greeting",
          type: "ai",
          content: `${greeting} 👋 I'm here to help you create a comprehensive media plan brief. This will take about 5 minutes and I'll ask you 8 key questions to understand your campaign needs.`,
          timestamp: new Date(),
        }
      ];

      // Add previous Q&A pairs
      for (let i = 0; i < result.session.currentStep; i++) {
        const question = questions[i];
        const answer = conversationData[question.id as keyof ConversationData];
        
        if (question && answer) {
          newMessages.push(
            {
              id: `question-${question.id}`,
              type: "ai",
              content: question.question,
              timestamp: new Date(),
            },
            {
              id: `answer-${question.id}`,
              type: "user",
              content: answer,
              timestamp: new Date(),
            }
          );
        }
      }

      // Add current question
      if (result.currentQuestion) {
        newMessages.push({
          id: `question-${result.currentQuestion.id}`,
          type: "ai",
          content: result.currentQuestion.question,
          timestamp: new Date(),
        });
        setShowPlatforms(result.currentQuestion.type === 'platform');
      }

      setMessages(newMessages);
      setIsComplete(false);
      queryClient.invalidateQueries({ queryKey: ["/api/conversation", sessionId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to go back. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate campaign brief mutation
  const generateBriefMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/conversation/${sessionId}/generate-brief`),
    onSuccess: async (response) => {
      const result = await response.json();
      setCampaignBrief(result.brief);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate campaign brief.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (answer: string) => {
    if (!answer.trim() || !sessionId) return;
    submitResponseMutation.mutate(answer);
  };

  const handleInputSubmit = () => {
    handleSubmit(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  const handleGoBack = () => {
    if (!sessionId) return;
    goBackMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[500px]">
        {messages.map((message) => (
          <div key={message.id} className={`flex space-x-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
            {message.type === 'ai' && (
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="text-white text-xs" />
              </div>
            )}
            
            <div className="flex-1 max-w-md">
              <div className={`rounded-xl p-4 ${
                message.type === 'ai' 
                  ? 'bg-slate-100' 
                  : 'bg-primary text-white ml-auto'
              }`}>
                <p className={message.type === 'ai' ? 'text-secondary' : 'text-white'}>
                  {message.content}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">Just now</p>
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-slate-600 text-xs" />
              </div>
            )}
          </div>
        ))}

        {/* Campaign Summary */}
        {isComplete && campaignBrief && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-blue-50 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center">
                  <CheckCircle className="text-accent mr-2" />
                  Brief Summary
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">Campaign Details:</p>
                    <p className="text-slate-600">{campaignBrief.company} - {campaignBrief.product}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Platforms:</p>
                    <p className="text-slate-600">{campaignBrief.platforms}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Budget:</p>
                    <p className="text-slate-600">{campaignBrief.budget}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Duration:</p>
                    <p className="text-slate-600">{campaignBrief.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration CTA */}
            <Card className="border-2 border-primary">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">Your Brief is Ready!</h3>
                <p className="text-slate-600 mb-6">Get your complete AI-generated media plan with detailed forecasts, budget allocation, and activation guide.</p>
                <div className="space-y-3">
                  <Button className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Create Free Account & Get Full Plan
                  </Button>
                  <p className="text-xs text-slate-500">No credit card required • Full access • Download PDF guide</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isComplete && (
        <div className="p-6 border-t border-slate-200">
          {showPlatforms ? (
            <PlatformSelection onSelect={handleSubmit} />
          ) : (
            <div className="flex space-x-3">
              <Input
                type="text"
                placeholder={currentQuestion?.placeholder || "Type your answer here..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={submitResponseMutation.isPending}
              />
              <Button
                onClick={handleInputSubmit}
                disabled={!inputValue.trim() || submitResponseMutation.isPending}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {submitResponseMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            {session && session.currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handleGoBack}
                disabled={goBackMutation.isPending}
                className="text-slate-500 hover:text-secondary transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Previous
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
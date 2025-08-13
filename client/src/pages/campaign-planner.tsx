import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ChatInterface } from "@/components/chat-interface";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CampaignPlanner() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Fetch questions for the chat interface
  const { data: questions = [], isLoading: questionsLoading } = useQuery<any[]>({
    queryKey: ["/api/questions"],
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/conversation/start"),
    onSuccess: async (response) => {
      const newSession = await response.json();
      setSessionId(newSession.id);
    },
  });

  // Fetch session data when sessionId is available
  const { data: session, isLoading: sessionLoading } = useQuery<any>({
    queryKey: ["/api/conversation", sessionId],
    enabled: !!sessionId,
  });

  // Start session automatically if not started
  if (!sessionId && !startConversationMutation.isPending) {
    startConversationMutation.mutate();
  }

  const handleComplete = () => {
    // Navigate to auth page after completion
    window.location.href = "/auth";
  };

  if (questionsLoading || startConversationMutation.isPending || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Starting your campaign planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">YourBrief</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Campaign Planner Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Campaign Planning Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Answer 8 strategic questions and get a comprehensive AI-powered campaign brief 
            with budget allocation, platform strategies, and performance forecasts.
          </p>
        </div>

        {session && sessionId && questions.length > 0 && (
          <ChatInterface
            session={session}
            sessionId={sessionId}
            questions={questions}
            greeting="Hi! I'm your AI campaign planning assistant. I'll ask you 8 strategic questions to create a comprehensive media plan for your campaign. Let's start!"
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
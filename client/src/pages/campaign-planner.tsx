import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ChatInterface } from "@/components/chat-interface";
import { CampaignSummary } from "@/components/campaign-summary";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CampaignPlanner() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

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
    // Show summary before navigating to auth
    setShowSummary(true);
  };

  const handleContinueToAuth = () => {
    // Navigate to auth page after viewing summary
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

  // Show summary if conversation is complete
  if (showSummary && session?.sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mr-4"
                  onClick={() => setShowSummary(false)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
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

        {/* Campaign Summary */}
        <div className="py-8">
          <CampaignSummary 
            sessionData={session.sessionData} 
            onContinue={handleContinueToAuth}
          />
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
            </div>
            <div className="relative">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-6">
                Campaign Planning Assistant
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6 rounded-full"></div>
            </div>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Answer <span className="font-bold text-blue-600 dark:text-blue-400">4 open-ended questions</span> and get a comprehensive 
            <span className="font-bold text-purple-600 dark:text-purple-400"> AI-powered campaign brief</span> with professional targeting terminology 
            and structured media recommendations.
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>~5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>AI-Enhanced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Professional Brief</span>
            </div>
          </div>
        </div>

        {session && sessionId && questions.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <ChatInterface
              session={session}
              sessionId={sessionId}
              questions={questions}
              greeting="Hi! I'm your AI campaign planning assistant. 👋 I'll ask you 4 questions to create a comprehensive media plan brief for your campaign. Describe your targeting in natural language - I'll transform it into professional industry-standard terminology. Let's get started!"
              onComplete={handleComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
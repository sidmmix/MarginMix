import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import { ProgressBar } from "@/components/progress-bar";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChartLine, 
  Brain, 
  TrendingUp, 
  FileText, 
  Shield, 
  Clock,
  CheckCircle,
  BarChart3,
  LogOut,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ConversationSession, Question, CampaignBrief } from "@shared/schema";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { user, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning!";
    if (hour >= 12 && hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  // Fetch current session if exists
  const { data: session } = useQuery<ConversationSession>({
    queryKey: ["/api/conversation", sessionId],
    enabled: !!sessionId,
  });

  // Start new conversation
  const startConversationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/conversation/start"),
    onSuccess: async (response) => {
      const newSession = await response.json();
      setSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversation"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize conversation on mount
  useEffect(() => {
    if (!sessionId) {
      startConversationMutation.mutate();
    }
  }, []);

  if (questionsLoading || !questions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Margin Mix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-bold text-secondary">Margin Mix</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 hidden sm:block">AI-Powered Media Planning</span>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={session?.currentStep || 0} 
          totalSteps={questions.length}
          isComplete={isComplete}
        />

        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Brain className="text-white text-lg" />
              </div>
              <div>
                <h2 className="font-semibold text-secondary">AI Media Planning Assistant</h2>
                <p className="text-sm text-slate-600">Let's create your perfect media plan brief</p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <ChatInterface
            session={session}
            sessionId={sessionId}
            questions={questions}
            greeting={getGreeting()}
            onComplete={() => setIsComplete(true)}
          />

          {/* Security and Time Info */}
          <div className="flex justify-center items-center space-x-6 p-4 text-xs text-slate-500 border-t border-slate-100">
            <span><Shield className="w-3 h-3 mr-1 inline" />Secure & Private</span>
            <span><Clock className="w-3 h-3 mr-1 inline" />~5 minutes</span>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="text-primary text-xl" />
            </div>
            <h3 className="font-semibold text-secondary mb-2">AI-Powered Insights</h3>
            <p className="text-sm text-slate-600">Get intelligent recommendations based on your campaign parameters and industry best practices.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-accent text-xl" />
            </div>
            <h3 className="font-semibold text-secondary mb-2">Real-Time Forecasting</h3>
            <p className="text-sm text-slate-600">Access live data from Google, Meta, and YouTube APIs for accurate reach and frequency predictions.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="text-orange-600 text-xl" />
            </div>
            <h3 className="font-semibold text-secondary mb-2">Comprehensive Reports</h3>
            <p className="text-sm text-slate-600">Download detailed PDF guides with activation instructions and optimization recommendations.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <ChartLine className="text-white text-xs" />
              </div>
              <span className="text-secondary font-medium">Margin Mix</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-600">
              <a href="#" className="hover:text-secondary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-secondary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-secondary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { ArrowRight, Target, BarChart3, Users, Zap, CheckCircle, User, LogOut } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100/20 to-purple-100/20 dark:from-blue-800/10 dark:to-purple-800/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-blue-100/20 dark:bg-blue-800/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-purple-100/20 dark:bg-purple-800/10 rounded-full blur-2xl"></div>
      </div>
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">YourBrief</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-username">
                        {(user as any).firstName} {(user as any).lastName}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400" data-testid="text-email">
                        {(user as any).email}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button variant="outline" size="sm" data-testid="button-signin">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Generate Activation Ready
              <span className="text-blue-600 dark:text-blue-400"> Digital Media Planning Inputs</span>
              <br />
              in Minutes
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              YourBrief is the AI Media Strategist that's essentially a Planning Decision Engine for YouTube and Meta. 
               <br />
              Just answer a few relevant questions, and YourBrief gives you a Structured Brief and Generates Platform-specific strategies with Performance Forecasts & Suggestive inventory level Media Mix.
               <br />
               <br />
              <span className="font-semibold">Faster planning. Smarter decisions. Precise advertising.</span>
            </p>
            <div className="flex justify-center">
              <Link href="/campaign-planner">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Planning Your Campaign
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Media Planning
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From strategy to execution, our AI-powered platform handles the complexity 
              while you focus on creative excellence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI-Powered Strategy
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get intelligent recommendations based on your campaign objectives and target audience.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Multi-Platform Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Plan across Google Ads, YouTube, Meta, and DV360 with unified budget allocation.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Audience Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Deep audience analysis and targeting recommendations for maximum impact.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Instant Briefs
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate comprehensive campaign briefs in minutes, not hours.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three simple steps to transform your campaign ideas into actionable media plans.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Answer 8 Questions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI guide asks strategic questions about your campaign goals, audience, and budget.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Get AI Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive intelligent recommendations, budget allocation, and platform strategies.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Execute & Optimize
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access the full platform to manage campaigns and track performance across all channels.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Benefits */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Marketing Teams & Digital Media Agencies Choose YourBrief
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Save 90% Planning Time</h3>
                    <p className="text-gray-600 dark:text-gray-300">Transform weeks of planning into minutes with AI-powered automation.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Data-Driven Decisions</h3>
                    <p className="text-gray-600 dark:text-gray-300">Make informed choices with real platform data and audience insights.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Unified Campaign Management</h3>
                    <p className="text-gray-600 dark:text-gray-300">Manage Google, Meta, YouTube, and DV360 campaigns from one platform.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Expert-Level Strategy</h3>
                    <p className="text-gray-600 dark:text-gray-300">Access strategies typically available only through expensive agencies.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Join thousands of marketers who've transformed their campaign planning process.
                </p>
                <Link href="/campaign-planner">
                  <Button size="lg" className="w-full text-lg">
                    Start Your Free Campaign Brief
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">YourBrief</h3>
            <p className="text-gray-400 mb-4">AI-powered Digital Media Planning & Activation</p>
            <p className="text-gray-500 text-sm">
              © 2025 YourBrief. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
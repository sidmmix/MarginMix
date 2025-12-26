import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Calculator, Brain, CheckCircle, User, LogOut, DollarSign, PieChart, AlertTriangle } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-emerald-100/20 dark:bg-emerald-800/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-teal-100/20 dark:bg-teal-800/10 rounded-full blur-2xl"></div>
      </div>
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Margin Mix</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                    <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
            <div className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Stop the Margin Leak!</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              The Financial Reasoning Engine
              <span className="text-emerald-600 dark:text-emerald-400"> for Media Agencies</span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Margin Mix is an <span className="font-semibold text-emerald-600 dark:text-emerald-400">Intelligent Financial Reasoning Engine</span> built on the World's first 
              <span className="font-semibold text-emerald-600 dark:text-emerald-400"> Workforce Intensity Matrix</span> — designed specifically for Media Agencies to be more profitable.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Identify margin leaks. Optimize resource allocation. Maximize agency profitability.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/campaign-planner">
                <Button size="lg" className="text-lg px-8 py-3 bg-emerald-600 hover:bg-emerald-700">
                  Start Protecting Your Margins
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
              Powered by the Workforce Intensity Matrix
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The world's first framework that correlates workforce effort with media planning margins — 
              giving you unprecedented visibility into profitability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Financial Reasoning AI
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Intelligent analysis that understands the true cost of media planning operations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Margin Leak Detection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Automatically identify where your agency is losing money on media planning.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <PieChart className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Media Mix Optimization
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Data-driven recommendations for optimal budget allocation across channels.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Profitability Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Clear visibility into margins, costs, and profit potential per campaign.
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
              How Margin Mix Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three steps to transform your agency's financial performance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Input Your Campaign Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter your media planning parameters, budgets, and workforce allocation details.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analyze with AI
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our Financial Reasoning Engine processes your data through the Workforce Intensity Matrix.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Optimize & Profit
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive actionable insights to stop margin leaks and maximize profitability.
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
                Why Media Agencies Choose Margin Mix
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Stop Margin Erosion</h3>
                    <p className="text-gray-600 dark:text-gray-300">Identify and eliminate hidden costs that eat into your profitability.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Workforce Intensity Insights</h3>
                    <p className="text-gray-600 dark:text-gray-300">Understand the true cost of human effort in every campaign.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Optimize Media Mix</h3>
                    <p className="text-gray-600 dark:text-gray-300">Data-driven allocation that balances performance with profitability.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Financial Transparency</h3>
                    <p className="text-gray-600 dark:text-gray-300">Clear visibility into margins, costs, and profit drivers across all campaigns.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-2xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Protect Your Margins?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Join leading media agencies that have transformed their profitability with Margin Mix.
                </p>
                <Link href="/campaign-planner">
                  <Button size="lg" className="w-full text-lg bg-emerald-600 hover:bg-emerald-700">
                    Get Started Now
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
            <h3 className="text-2xl font-bold text-emerald-400 mb-4">Margin Mix</h3>
            <p className="text-gray-400 mb-4">The Financial Reasoning Engine for Media Agencies</p>
            <p className="text-gray-400 text-sm mb-2">
              Margin Mix is a brand under Digital Lexicon Sdn Bhd
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 Margin Mix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

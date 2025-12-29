import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, TrendingUp, Shield, Calculator, Brain, CheckCircle, User, LogOut, DollarSign, PieChart, AlertTriangle, Globe, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState, type FormEvent } from "react";

export default function Landing() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleAnalyzeWebsite = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!websiteUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your website URL to get started.",
        variant: "destructive",
      });
      return;
    }

    // Add protocol if missing
    let urlToAnalyze = websiteUrl.trim();
    if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
      urlToAnalyze = 'https://' + urlToAnalyze;
    }

    // Validate URL format
    try {
      new URL(urlToAnalyze);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL (e.g., example.com)",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/dna-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToAnalyze }),
      });

      const data = await response.json();

      if (data.success && data.brief) {
        // Store the brand brief in sessionStorage for the campaign planner
        sessionStorage.setItem('brandBrief', JSON.stringify(data.brief));
        sessionStorage.setItem('analyzedUrl', urlToAnalyze);
        
        toast({
          title: "Website Analyzed!",
          description: `Found: ${data.brief.brand_name} in ${data.brief.industry_category}`,
        });

        // Navigate to dashboard with analysis results
        setLocation('/dashboard');
      } else {
        throw new Error(data.message || 'Failed to analyze website');
      }
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleAnalyzeWebsite} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter your client's website URL (e.g., stripe.com)"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={isAnalyzing}
                    className="pl-12 h-14 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 rounded-xl"
                    data-testid="input-website-url"
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg" 
                  disabled={isAnalyzing}
                  className="h-14 text-lg px-8 bg-emerald-600 hover:bg-emerald-700 rounded-xl whitespace-nowrap"
                  data-testid="button-analyze-website"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                We'll analyze the brand to customise suggestions!
              </p>
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

      {/* Competitive Differentiation */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How We Compare
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              See why leading agencies are switching to Margin Mix.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* vs. Consulting Firms */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <h3 className="text-xl font-bold text-white p-4 border-b border-gray-700">
                vs. Consulting Firms:
              </h3>
              <div className="divide-y divide-gray-700">
                <div className="grid grid-cols-2">
                  <div className="p-4 font-semibold text-white bg-gray-750">Big 4 Consulting</div>
                  <div className="p-4 font-semibold text-emerald-400">Margin Mix</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">$200K+ engagement</div>
                  <div className="p-4 text-emerald-300">$9.6K/year</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">12-week timeline</div>
                  <div className="p-4 text-emerald-300">Real-time, continuous</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Point-in-time analysis</div>
                  <div className="p-4 text-emerald-300">Always-on monitoring</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Generic frameworks</div>
                  <div className="p-4 text-emerald-300">Agency-specific models</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Consultants leave</div>
                  <div className="p-4 text-emerald-300">Intelligence persists</div>
                </div>
              </div>
            </div>

            {/* vs. Project Management Tools */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <h3 className="text-xl font-bold text-white p-4 border-b border-gray-700">
                vs. Project Management Tools:
              </h3>
              <div className="divide-y divide-gray-700">
                <div className="grid grid-cols-2">
                  <div className="p-4 font-semibold text-white bg-gray-750">PM Tools (Monday, Asana)</div>
                  <div className="p-4 font-semibold text-emerald-400">Margin Mix</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Operational task tracking</div>
                  <div className="p-4 text-emerald-300">Strategic financial intelligence</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Project-level visibility</div>
                  <div className="p-4 text-emerald-300">Portfolio-level optimization</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Designed for PMs</div>
                  <div className="p-4 text-emerald-300">Designed for CFOs/CEOs</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Time & task management</div>
                  <div className="p-4 text-emerald-300">Margin & profitability management</div>
                </div>
              </div>
            </div>

            {/* vs. Traditional BI Tools */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <h3 className="text-xl font-bold text-white p-4 border-b border-gray-700">
                vs. Traditional BI Tools:
              </h3>
              <div className="divide-y divide-gray-700">
                <div className="grid grid-cols-2">
                  <div className="p-4 font-semibold text-white bg-gray-750">Traditional BI Tools</div>
                  <div className="p-4 font-semibold text-emerald-400">Margin Mix</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Descriptive (what happened?)</div>
                  <div className="p-4 text-emerald-300">Prescriptive (what should we do?)</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Requires analyst to interpret</div>
                  <div className="p-4 text-emerald-300">AI generates executive insights</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Generic dashboards</div>
                  <div className="p-4 text-emerald-300">Agency-specific financial models</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Backward-looking</div>
                  <div className="p-4 text-emerald-300">Predictive + scenario planning</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 text-gray-300">Dashboard fatigue</div>
                  <div className="p-4 text-emerald-300">Actionable alerts only</div>
                </div>
              </div>
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
            <p className="text-white mb-4">The Financial Reasoning Engine for Media Agencies</p>
            <p className="text-white text-sm mb-2">
              Margin Mix is a Digital Lexicon Corp brand.
            </p>
            <p className="text-white text-sm mb-2">
              Digital Lexicon, Delaware, DE
            </p>
            <p className="text-white text-sm">
              © 2025 Digital Lexicon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

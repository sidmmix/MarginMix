import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Target, Sparkles, BarChart3, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface BrandBrief {
  brand_name: string;
  industry_category: string;
  top_3_usps: string[];
  complexity_score: number;
}

export default function CampaignPlanner() {
  const [brandBrief, setBrandBrief] = useState<BrandBrief | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedBrief = sessionStorage.getItem('brandBrief');
    const storedUrl = sessionStorage.getItem('analyzedUrl');
    
    if (storedBrief) {
      try {
        setBrandBrief(JSON.parse(storedBrief));
      } catch (e) {
        console.error('Failed to parse brand brief:', e);
      }
    }
    
    if (storedUrl) {
      setAnalyzedUrl(storedUrl);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Margin Mix</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="outline" size="sm" data-testid="button-signin">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {brandBrief ? (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Brand Analysis Complete</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {brandBrief.brand_name}
              </h1>
              {analyzedUrl && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Analyzed from: <span className="text-emerald-600 dark:text-emerald-400">{analyzedUrl}</span>
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Industry Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-industry">
                    {brandBrief.industry_category}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Complexity Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-emerald-600" data-testid="text-complexity-score">
                      {brandBrief.complexity_score}
                    </span>
                    <span className="text-gray-500">/ 10</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {brandBrief.complexity_score <= 3 ? 'Simple' : brandBrief.complexity_score <= 6 ? 'Moderate' : 'Complex'} product/service offering
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Top 3 Unique Selling Propositions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {brandBrief.top_3_usps.map((usp, index) => (
                    <li key={index} className="flex items-start gap-3" data-testid={`text-usp-${index}`}>
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{usp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Optimize Your Margins?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                    Sign in to access the full Margin Mix Financial Reasoning Engine and start protecting your agency's profitability.
                  </p>
                  <Link href="/auth">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-signin-cta">
                      Sign In to Continue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No Brand Analysis Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Enter your client's website URL on the homepage to get started with brand analysis.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-go-home">
                Go to Homepage
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

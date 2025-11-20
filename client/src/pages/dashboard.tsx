import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { User, LogOut, FileText, Heart, CheckCircle, TrendingUp, Target, DollarSign, Calendar, Eye, MousePointer, Repeat, Sparkles, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType, CampaignBrief } from "@shared/schema";

// Helper function to format labels from question options
const formatLabel = (value: string, questionId: string): string => {
  const labels: Record<string, Record<string, string>> = {
    product: {
      'ecommerce': 'Ecommerce app/Superapp',
      'fmcg': 'FMCG/CPG',
      'd2c_beauty': 'D2C Beauty/Skincare/Personal Care/Haircare/Wellness',
      'fintech': 'Fintech/Financial Services'
    },
    platforms: {
      'youtube': 'YouTube',
      'meta': 'Meta',
      'both': 'Both YouTube & Meta'
    },
    objective: {
      'awareness': 'Awareness',
      'consideration': 'Consideration',
      'sales_lead_gen': 'Sales/Lead Generation'
    },
    audience: {
      'us_inmarket_shoppers': '18–54, Male and Female, US Metro Areas, InMarket Shoppers',
      'us_affinity_shoppers': '18–54, Male and Female, US Metro Areas, Affinity Shoppers',
      'us_inmarket_financial': '18–54, Male and Female, US Metro Areas, InMarket Financial Services',
      'us_affinity_financial': '18–54, Male and Female, US Metro Areas, Affinity Financial Services',
      'au_inmarket_shoppers': '18–54, Male and Female, Australia Urban, InMarket Shoppers',
      'au_affinity_shoppers': '18–54, Male and Female, Australia Urban, Affinity Shoppers',
      'au_inmarket_financial': '18–54, Male and Female, Australia Urban, InMarket Financial Services',
      'au_affinity_financial': '18–54, Male and Female, Australia Urban, Affinity Financial Services'
    },
    timeframe: {
      '1_2_weeks': '1-2 weeks',
      '1_month': '1 month',
      '2_3_months': '2-3 months'
    },
    season: {
      'only_festive': 'Yes (Festive/Holiday Season)',
      'beyond_festive': 'No (Beyond Holiday Season)'
    },
    budget: {
      'usd_under_100k': '< US$ 100,000',
      'usd_100_200k': 'US$ 100,000 to 200,000',
      'usd_200_500k': 'US$ 200,000 to 500,000',
      'usd_500_800k': 'US$ 500,000 to 800,000',
      'usd_800_1500k': 'US$ 800,000 to 1,500,000',
      'usd_1500_3000k': 'US$ 1,500,000 to 3,000,000',
      'usd_3m_plus': 'US$ 3 mn+',
      'usd_5m_plus': 'US$ 5 mn+',
      'aud_under_150k': '< AU$ 150,000',
      'aud_150_300k': 'AU$ 150,000 to 300,000',
      'aud_300_750k': 'AU$ 300,000 to 750,000',
      'aud_750_1200k': 'AU$ 750,000 to 1,200,000',
      'aud_1200_2250k': 'AU$ 1,200,000 to 2,250,000',
      'aud_2250_4500k': 'AU$ 2,250,000 to 4,500,000',
      'aud_4500k_plus': 'AU$ 4.5 mn+',
      'aud_7500k_plus': 'AU$ 7.5 mn+'
    }
  };
  return labels[questionId]?.[value] || value;
};

export default function Dashboard() {
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const { user, logout, isLoggingOut, isAuthenticated } = useAuth();
  
  // Type guard for user
  const typedUser = user as UserType | undefined;

  // Fetch user's campaign briefs
  const { data: campaignBriefs = [], isLoading: isBriefsLoading } = useQuery<CampaignBrief[]>({
    queryKey: ["/api/campaign-briefs"],
    enabled: isAuthenticated,
  });

  // Get the most recent campaign brief
  const latestBrief = campaignBriefs.length > 0 ? campaignBriefs[campaignBriefs.length - 1] : null;
  
  // Fetch session data for the latest brief
  const { data: session } = useQuery<any>({
    queryKey: [`/api/conversation/${latestBrief?.sessionId}`],
    enabled: !!latestBrief?.sessionId,
  });

  // Fetch questions for displaying user inputs
  const { data: questions = [] } = useQuery<any[]>({
    queryKey: ["/api/questions"],
  });

  const sessionData = session?.sessionData || {};

  // Auto-logout after 5 minutes of inactivity
  useActivityTracker({
    onInactivityTimeout: () => {
      console.log('User inactive for 5 minutes - auto logout');
      handleLogout();
    },
    timeoutMinutes: 5,
    isActive: isAuthenticated
  });

  const handleLogout = async () => {
    try {
      await logout();
      setShowThankYouModal(true);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYouModal(false);
    window.location.href = '/';
  };

  // Parse AI insights
  const insights = latestBrief?.aiInsights as any || {};
  const recommendations = insights.recommendations || [];
  const budgetAllocation = insights.budgetAllocation || {};
  const platformStrategies = insights.platformStrategies || {};
  const kpis = insights.kpis || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                YourBrief Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{typedUser?.firstName} {typedUser?.lastName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            </div>
            <div className="relative">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                Welcome back, {typedUser?.firstName}!
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Your AI-powered campaign brief is ready
              </p>
            </div>
          </div>
        </div>

        {isBriefsLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">Loading your campaign brief...</p>
          </div>
        ) : !latestBrief ? (
          <div className="text-center py-12">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  No Campaign Brief Yet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Start a new campaign planning session to generate your personalized brief.
                </p>
                <Button 
                  onClick={() => window.location.href = '/campaign-planner'}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  data-testid="button-start-campaign"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Start Campaign Planner
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Campaign Header */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {latestBrief.briefTitle || 'Campaign Brief'}
                </CardTitle>
                <p className="text-blue-100">
                  Generated by YourBrief AI Media Strategist • {new Date(latestBrief.createdAt || new Date()).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </CardHeader>
            </Card>

            {/* Your Campaign Requirements - 11 Questions */}
            {questions.length > 0 && Object.keys(sessionData).length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Your Campaign Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questions.map((q: any) => {
                      const answer = sessionData[q.id];
                      if (!answer) return null;
                      return (
                        <div key={q.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700" data-testid={`requirement-${q.id}`}>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">{q.question}</span>
                          <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">{answer}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  AI-Generated Campaign Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div data-testid="detail-brief-title">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Brief Title</span>
                    <p className="text-gray-900 dark:text-white">{latestBrief?.briefTitle || 'Not specified'}</p>
                  </div>
                  <div data-testid="detail-industry-vertical">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry Vertical</span>
                    <p className="text-gray-900 dark:text-white">{latestBrief?.industryVertical || 'Not specified'}</p>
                  </div>
                  <div data-testid="detail-geo-targeting" className="md:col-span-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Geographic Targeting</span>
                    <p className="text-gray-900 dark:text-white">
                      Primary: {((latestBrief?.geoTargeting as any)?.primary_markets || []).join(', ') || 'Not specified'}
                      {((latestBrief?.geoTargeting as any)?.secondary_markets || []).length > 0 && (
                        <span className="block mt-1">
                          Secondary: {((latestBrief?.geoTargeting as any)?.secondary_markets || []).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div data-testid="detail-demographics">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Demographics</span>
                    <p className="text-gray-900 dark:text-white">
                      {((latestBrief?.demographics as any)?.age_range || 'Not specified')}
                    </p>
                  </div>
                  <div data-testid="detail-affinity-buckets">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Affinity Buckets</span>
                    <p className="text-gray-900 dark:text-white">
                      {(latestBrief?.affinityBuckets as string[] || []).join(', ') || 'Not specified'}
                    </p>
                  </div>
                  <div data-testid="detail-in-market-segments" className="md:col-span-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">In-Market Segments</span>
                    <p className="text-gray-900 dark:text-white">
                      {(latestBrief?.inMarketSegments as string[] || []).join(', ') || 'Not specified'}
                    </p>
                  </div>
                  <div data-testid="detail-youtube-cpm">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">YouTube CPM</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.estimated_cpm || 'N/A'}
                    </p>
                  </div>
                  <div data-testid="detail-youtube-impressions">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">YouTube Impressions</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.estimated_impressions || 'N/A'}
                    </p>
                  </div>
                  <div data-testid="detail-meta-cpm">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Meta CPM</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.estimated_cpm || 'N/A'}
                    </p>
                  </div>
                  <div data-testid="detail-meta-impressions">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Meta Impressions</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.estimated_impressions || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Brief Sections */}
            {(latestBrief?.aiInsights as any)?.generatedBrief && (
              <>
                {/* Budget Details */}
                {(latestBrief?.aiInsights as any)?.generatedBrief?.budget_details && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Budget & Investment Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div data-testid="budget-total">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Budget</span>
                          <p className="text-gray-900 dark:text-white font-semibold">{(latestBrief?.aiInsights as any)?.generatedBrief?.budget_details?.total_budget || 'Not specified'}</p>
                        </div>
                        <div data-testid="budget-duration">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Flight Duration</span>
                          <p className="text-gray-900 dark:text-white">{(latestBrief?.aiInsights as any)?.generatedBrief?.budget_details?.flight_duration || 'Not specified'}</p>
                        </div>
                        <div data-testid="budget-strategy" className="md:col-span-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Allocation Strategy</span>
                          <p className="text-gray-900 dark:text-white">{(latestBrief?.aiInsights as any)?.generatedBrief?.budget_details?.allocation_strategy || 'Not specified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Campaign Objectives */}
                {(latestBrief?.aiInsights as any)?.generatedBrief?.campaign_objectives && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Campaign Objectives & KPIs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div data-testid="kpi-primary">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary KPI</span>
                          <p className="text-gray-900 dark:text-white font-semibold">{(latestBrief?.aiInsights as any)?.generatedBrief?.campaign_objectives?.primary_kpi || 'Not specified'}</p>
                        </div>
                        {(latestBrief?.aiInsights as any)?.generatedBrief?.campaign_objectives?.secondary_kpis && (
                          <div data-testid="kpi-secondary">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Secondary KPIs</span>
                            <ul className="list-disc list-inside text-gray-900 dark:text-white">
                              {((latestBrief?.aiInsights as any)?.generatedBrief?.campaign_objectives?.secondary_kpis || []).map((kpi: string, idx: number) => (
                                <li key={idx}>{kpi}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div data-testid="kpi-timeline">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Timeline</span>
                          <p className="text-gray-900 dark:text-white">{(latestBrief?.aiInsights as any)?.generatedBrief?.campaign_objectives?.target_timeline || 'Not specified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Creative Strategy */}
                {(latestBrief?.aiInsights as any)?.generatedBrief?.creative_strategy && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Creative Strategy & Messaging
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div data-testid="creative-theme">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Messaging Theme</span>
                          <p className="text-gray-900 dark:text-white">{(latestBrief?.aiInsights as any)?.generatedBrief?.creative_strategy?.messaging_theme || 'Not specified'}</p>
                        </div>
                        {(latestBrief?.aiInsights as any)?.generatedBrief?.creative_strategy?.key_messages && (
                          <div data-testid="creative-messages">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Messages</span>
                            <ul className="list-disc list-inside text-gray-900 dark:text-white">
                              {((latestBrief?.aiInsights as any)?.generatedBrief?.creative_strategy?.key_messages || []).map((msg: string, idx: number) => (
                                <li key={idx}>{msg}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Competitive Analysis */}
                {(latestBrief?.aiInsights as any)?.generatedBrief?.competitive_analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        Competitive Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(latestBrief?.aiInsights as any)?.generatedBrief?.competitive_analysis?.key_competitors && (
                          <div data-testid="competitors">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Competitors</span>
                            <p className="text-gray-900 dark:text-white">{((latestBrief?.aiInsights as any)?.generatedBrief?.competitive_analysis?.key_competitors || []).join(', ')}</p>
                          </div>
                        )}
                        <div data-testid="differentiation">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Differentiation</span>
                          <p className="text-gray-900 dark:text-white">{(latestBrief?.aiInsights as any)?.generatedBrief?.competitive_analysis?.differentiation || 'Not specified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* YouTube Strategy */}
                {(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-red-600" />
                        YouTube Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div data-testid="youtube-recommended">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Recommendation Status</span>
                          <p className="text-gray-900 dark:text-white font-semibold">
                            {(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.recommended ? '✅ Recommended' : '❌ Not Recommended'}
                          </p>
                        </div>
                        <div data-testid="youtube-rationale">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Strategic Rationale</span>
                          <p className="text-gray-900 dark:text-white">{(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.rationale || 'Not specified'}</p>
                        </div>
                        {(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.suggested_formats && (
                          <div data-testid="youtube-formats">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Suggested Formats</span>
                            <p className="text-gray-900 dark:text-white">{((latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.suggested_formats || []).join(', ')}</p>
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div data-testid="youtube-cpm">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated CPM</span>
                            <p className="text-gray-900 dark:text-white font-semibold">{(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.estimated_cpm || 'Not specified'}</p>
                          </div>
                          <div data-testid="youtube-impressions">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Monthly Impressions</span>
                            <p className="text-gray-900 dark:text-white font-semibold">{(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.estimated_impressions || 'Not specified'}</p>
                          </div>
                        </div>
                        {(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.benchmark_source && (
                          <div data-testid="youtube-benchmark-source" className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                              Source: {(latestBrief?.aiInsights as any)?.generatedBrief?.youtube_strategy?.benchmark_source}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Meta Strategy */}
                {(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        Meta (Facebook/Instagram) Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div data-testid="meta-recommended">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Recommendation Status</span>
                          <p className="text-gray-900 dark:text-white font-semibold">
                            {(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.recommended ? '✅ Recommended' : '❌ Not Recommended'}
                          </p>
                        </div>
                        <div data-testid="meta-rationale">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Strategic Rationale</span>
                          <p className="text-gray-900 dark:text-white">{(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.rationale || 'Not specified'}</p>
                        </div>
                        {(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.suggested_formats && (
                          <div data-testid="meta-formats">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Suggested Formats</span>
                            <p className="text-gray-900 dark:text-white">{((latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.suggested_formats || []).join(', ')}</p>
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div data-testid="meta-cpm">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated CPM</span>
                            <p className="text-gray-900 dark:text-white font-semibold">{(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.estimated_cpm || 'Not specified'}</p>
                          </div>
                          <div data-testid="meta-impressions">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Monthly Impressions</span>
                            <p className="text-gray-900 dark:text-white font-semibold">{(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.estimated_impressions || 'Not specified'}</p>
                          </div>
                        </div>
                        {(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.benchmark_source && (
                          <div data-testid="meta-benchmark-source" className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                              Source: {(latestBrief?.aiInsights as any)?.generatedBrief?.meta_strategy?.benchmark_source}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* AI Strategic Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    AI Strategic Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2" data-testid={`recommendation-${index}`}>
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Budget Allocation & KPIs */}
            <div className="grid md:grid-cols-2 gap-8">
              {Object.keys(budgetAllocation).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Budget Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(budgetAllocation).map(([platform, allocation]) => (
                        <div key={platform} className="flex justify-between" data-testid={`budget-${platform.toLowerCase()}`}>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{platform}</span>
                          <span className="text-gray-900 dark:text-white">{String(allocation)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {kpis.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Key Performance Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {kpis.map((kpi: string, index: number) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                          data-testid={`kpi-${index}`}
                        >
                          {kpi}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Platform-Specific Strategies */}
            {Object.keys(platformStrategies).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Platform-Specific Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(platformStrategies).map(([platform, strategy]) => (
                      <div key={platform} data-testid={`strategy-${platform.toLowerCase()}`}>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{platform}</h4>
                        <p className="text-gray-700 dark:text-gray-300">{String(strategy)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create New Campaign Button */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Need a new campaign?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Start a new planning session to create another campaign brief
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/campaign-planner'}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    data-testid="button-new-campaign"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Create New Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Thank You Modal */}
      <Dialog open={showThankYouModal} onOpenChange={setShowThankYouModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 justify-center text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Thank You!
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="mb-6">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                Thank you for using YourBrief!
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                We hope our AI-powered campaign planner helped you create amazing digital media strategies.
              </p>
            </div>
            <Button 
              onClick={handleThankYouClose}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-thank-you-close"
            >
              Continue to Homepage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

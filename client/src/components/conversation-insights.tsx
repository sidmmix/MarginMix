import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Target, AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationInsightsProps {
  sessionId: string;
  className?: string;
}

interface Insights {
  insights: string[];
  recommendations: string[];
  potentialChallenges: string[];
}

export function ConversationInsights({ sessionId, className }: ConversationInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: insights, isLoading } = useQuery<Insights>({
    queryKey: [`/api/conversation/${sessionId}/insights`],
    enabled: !!sessionId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !insights) {
    return (
      <Card className={cn("border-purple-200 bg-purple-50/30", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <CardTitle className="text-sm text-purple-900">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-purple-600">Analyzing your responses...</div>
        </CardContent>
      </Card>
    );
  }

  const hasContent = insights.insights.length > 0 || insights.recommendations.length > 0 || insights.potentialChallenges.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={cn("border-purple-200 bg-purple-50/30", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-sm text-purple-900">AI Insights</CardTitle>
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
              Live Analysis
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Insights - Always Visible */}
        {insights.insights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-900">Key Insights</span>
            </div>
            <div className="space-y-1">
              {insights.insights.slice(0, isExpanded ? undefined : 2).map((insight, index) => (
                <div key={index} className="text-xs text-green-800 bg-green-50 p-2 rounded">
                  {insight}
                </div>
              ))}
              {!isExpanded && insights.insights.length > 2 && (
                <div className="text-xs text-green-600 italic">
                  +{insights.insights.length - 2} more insights...
                </div>
              )}
            </div>
          </div>
        )}

        {isExpanded && (
          <>
            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <>
                <Separator className="bg-purple-200" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Strategic Recommendations</span>
                  </div>
                  <div className="space-y-1">
                    {insights.recommendations.map((rec, index) => (
                      <div key={index} className="text-xs text-blue-800 bg-blue-50 p-2 rounded">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Potential Challenges */}
            {insights.potentialChallenges.length > 0 && (
              <>
                <Separator className="bg-purple-200" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-900">Potential Challenges</span>
                  </div>
                  <div className="space-y-1">
                    {insights.potentialChallenges.map((challenge, index) => (
                      <div key={index} className="text-xs text-amber-800 bg-amber-50 p-2 rounded">
                        {challenge}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {!isExpanded && (insights.recommendations.length > 0 || insights.potentialChallenges.length > 0) && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-purple-600 hover:text-purple-800 h-6"
              onClick={() => setIsExpanded(true)}
            >
              View All Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
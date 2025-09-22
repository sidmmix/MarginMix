import { useState, useEffect, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface IntelligentInputProps {
  sessionId: string;
  questionId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

interface PredictiveResponse {
  suggestions: string[];
  nextQuestionPreview?: string;
  contextualHints: string[];
  validationFeedback?: string;
}

export function IntelligentInput({
  sessionId,
  questionId,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  onSubmit
}: IntelligentInputProps) {
  const [predictions, setPredictions] = useState<PredictiveResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when question changes
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [questionId, disabled]);

  // Debounced prediction fetching - only for longer responses
  const fetchPredictions = useCallback(
    async (input: string) => {
      // Only suggest for longer responses (10+ characters) to avoid interference
      if (input.length < 10 || disabled) {
        setPredictions(null);
        return;
      }

      try {
        const response = await apiRequest("POST", `/api/conversation/${sessionId}/predict`, { 
          currentInput: input, 
          questionId 
        });
        const data = await response.json();
        setPredictions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching predictions:", error);
      }
    },
    [sessionId, questionId, disabled]
  );

  // Debounce effect
  useEffect(() => {
    if (disabled) {
      setPredictions(null);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      if (value && !isTyping && !disabled) {
        fetchPredictions(value);
      }
    }, 1200); // Increased delay to 1.2 seconds for less interruption

    return () => clearTimeout(timer);
  }, [value, isTyping, fetchPredictions, disabled]);

  const handleInputChange = (newValue: string) => {
    setIsTyping(true);
    onChange(newValue);
    
    // Stop typing indicator after user stops
    setTimeout(() => setIsTyping(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const applySuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const enhanceWithSuggestion = (suggestion: string) => {
    const enhanced = value ? `${value} ${suggestion}` : suggestion;
    onChange(enhanced);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("min-h-[100px] resize-none", className)}
          onFocus={() => setShowSuggestions(!!predictions)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={disabled}
          autoFocus
        />
        
        {isTyping && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
              AI analyzing...
            </Badge>
          </div>
        )}
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && predictions && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 space-y-3">
            {/* Smart Suggestions */}
            {predictions.suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Smart Suggestions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {predictions.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 bg-white hover:bg-blue-100"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Contextual Hints */}
            {predictions.contextualHints.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Consider Including</span>
                </div>
                <div className="space-y-1">
                  {predictions.contextualHints.map((hint, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-auto p-2 text-xs text-left justify-start w-full hover:bg-green-100"
                      onClick={() => enhanceWithSuggestion(hint)}
                    >
                      <span className="text-green-700">{hint}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Feedback */}
            {predictions.validationFeedback && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Feedback</span>
                </div>
                <p className="text-sm text-amber-800 bg-amber-50 p-2 rounded">
                  {predictions.validationFeedback}
                </p>
              </div>
            )}

            {/* Next Question Preview */}
            {predictions.nextQuestionPreview && (
              <div className="pt-2 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-700">Next: {predictions.nextQuestionPreview}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
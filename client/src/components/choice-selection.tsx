import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { Question } from "@shared/schema";

interface ChoiceSelectionProps {
  question: Question;
  onSelect: (value: string | string[]) => void;
}

export function ChoiceSelection({ question, onSelect }: ChoiceSelectionProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  if (!question.options) {
    return null;
  }

  const handleSingleChoice = (value: string) => {
    setSelectedValues([value]);
    onSelect(value);
  };

  const handleMultipleChoice = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newSelection);
  };

  const submitMultipleChoice = () => {
    if (selectedValues.length > 0) {
      onSelect(selectedValues);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <Button
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              onClick={() => question.type === 'single_choice' 
                ? handleSingleChoice(option.value)
                : handleMultipleChoice(option.value)
              }
              className={`p-4 h-auto border rounded-lg transition-all text-left justify-start ${
                isSelected 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-slate-300 hover:border-primary hover:bg-primary/5"
              }`}
              data-testid={`choice-${option.value}`}
            >
              <div className="flex items-center space-x-3 w-full">
                {question.type === 'multiple_choice' && (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? "border-primary-foreground bg-primary-foreground text-primary" 
                      : "border-slate-400"
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                )}
                <div className="flex-1">
                  <p className={`font-medium ${isSelected ? "text-primary-foreground" : "text-secondary"}`}>
                    {option.label}
                  </p>
                  {option.description && (
                    <p className={`text-xs mt-1 ${isSelected ? "text-primary-foreground/80" : "text-slate-500"}`}>
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
      
      {question.type === 'multiple_choice' && (
        <div className="flex justify-end">
          <Button 
            onClick={submitMultipleChoice}
            disabled={selectedValues.length === 0}
            className="min-w-[120px]"
            data-testid="submit-multiple-choice"
          >
            Continue ({selectedValues.length} selected)
          </Button>
        </div>
      )}
    </div>
  );
}
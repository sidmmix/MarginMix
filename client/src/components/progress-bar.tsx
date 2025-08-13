interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  isComplete?: boolean;
}

export function ProgressBar({ currentStep, totalSteps, isComplete }: ProgressBarProps) {
  const progress = isComplete ? 100 : ((currentStep + 1) / totalSteps) * 100;
  const stepText = isComplete ? "Brief Complete!" : `Step ${currentStep + 1} of ${totalSteps}`;

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-slate-600 mb-2">
        <span>Brief Creation Progress</span>
        <span>{stepText}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
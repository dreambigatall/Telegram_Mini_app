interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * ProgressBar Component
 * Shows visual progress indicator for multi-step forms
 */
export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  return (
    <div className="flex space-x-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        
        return (
          <div
            key={stepNumber}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-blue-500' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        );
      })}
    </div>
  );
};


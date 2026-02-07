import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep && onStepClick;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all duration-300',
                  isClickable && 'cursor-pointer hover:scale-105',
                  !isClickable && 'cursor-default'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 border-2',
                    isCompleted && 'bg-primary text-primary-foreground border-primary cyber-glow',
                    isCurrent && 'bg-transparent text-primary border-primary cyber-glow animate-pulse-glow',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground border-border'
                  )}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : index + 1}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      isCurrent && 'text-primary cyber-glow-text',
                      isCompleted && 'text-primary',
                      !isCurrent && !isCompleted && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </button>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      'h-0.5 transition-all duration-500',
                      index < currentStep
                        ? 'bg-gradient-to-r from-primary to-secondary'
                        : 'bg-border'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

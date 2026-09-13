"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, UserPlus, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: "account", label: "Creating account", icon: UserPlus },
  { id: "profile", label: "Setting up profile", icon: Settings },
  { id: "dashboard", label: "Preparing dashboard", icon: LayoutDashboard },
];

interface SignupStepperProps {
  /** Current step index (0-based). Steps auto-advance based on timing. */
  currentStep?: number;
  className?: string;
}

export function SignupStepper({ currentStep: controlledStep, className }: SignupStepperProps) {
  const [internalStep, setInternalStep] = useState(0);
  const currentStep = controlledStep ?? internalStep;

  // Auto-advance steps if not controlled externally
  useEffect(() => {
    if (controlledStep !== undefined) return;

    const timers: NodeJS.Timeout[] = [];

    // Step 1 → 2 after 1.5s
    timers.push(setTimeout(() => setInternalStep(1), 1500));
    // Step 2 → 3 after 3s
    timers.push(setTimeout(() => setInternalStep(2), 3000));

    return () => timers.forEach(clearTimeout);
  }, [controlledStep]);

  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      {/* Logo / Brand */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Setting up your account</h2>
        <p className="text-sm text-gray-500">This will only take a moment</p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isCurrent && "bg-indigo-50 border border-indigo-100",
                isCompleted && "bg-green-50/50",
                isPending && "opacity-40"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-indigo-600 text-white",
                  isPending && "bg-gray-100 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isCurrent && "text-indigo-900",
                    isCompleted && "text-green-700",
                    isPending && "text-gray-400"
                  )}
                >
                  {step.label}
                </p>
              </div>
              {isCompleted && (
                <span className="text-xs text-green-600 font-medium">Done</span>
              )}
              {isCurrent && (
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

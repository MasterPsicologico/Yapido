'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
    currentStep: number;
    steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                    <li key={step} className={cn("relative", stepIdx !== steps.length - 1 ? "flex-1" : "")}>
                        <div className="flex items-center">
                            <span className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                                stepIdx <= currentStep ? "bg-primary" : "bg-card border-2 border-border"
                            )}>
                                {stepIdx < currentStep ? (
                                    <Check className="h-5 w-5 text-primary-foreground" />
                                ) : (
                                    <span className={cn(
                                        "text-sm font-medium",
                                        stepIdx === currentStep ? "text-primary-foreground" : "text-muted-foreground"
                                    )}>
                                        {stepIdx + 1}
                                    </span>
                                )}
                            </span>
                            <span className={cn(
                                "ml-4 hidden text-sm font-medium sm:block",
                                stepIdx <= currentStep ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step}
                            </span>
                        </div>
                        {stepIdx < steps.length - 1 && (
                            <div className="absolute right-0 top-4 -z-10 h-0.5 w-[calc(100%-2.25rem)] translate-x-1/2 bg-border" aria-hidden="true">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: stepIdx < currentStep ? 1 : 0 }}
                                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                                    style={{ transformOrigin: 'left' }}
                                />
                            </div>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

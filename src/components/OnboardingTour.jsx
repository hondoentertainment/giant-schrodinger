import React, { useState, useCallback } from 'react';

const STEPS = [
    {
        title: 'Welcome!',
        description: 'Welcome to Venn with Friends! Connect two random concepts with one witty phrase.',
    },
    {
        title: 'The Concepts',
        description: "You'll see two concepts like these. Your job: find the witty connection.",
    },
    {
        title: 'Your Connection',
        description: 'Type your creative connection here. The wittier, the better!',
    },
    {
        title: 'Scoring',
        description: "You'll be scored on wit, logic, originality, and clarity. Aim for 8+!",
    },
    {
        title: "Let's Go!",
        description: "Ready? Let's play your first round!",
    },
];

export function OnboardingTour({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);

    const finish = useCallback(() => {
        localStorage.setItem('venn_onboarding_complete', 'true');
        onComplete();
    }, [onComplete]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            finish();
        }
    };

    const handleSkip = () => {
        finish();
    };

    const step = STEPS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;

    return (
        <div
            className="game-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-tour-title"
        >
            <div className="w-full max-w-md wordle-card p-8 animate-spring-in">
                <div className="flex justify-center gap-2 mb-6">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`game-progress-dot ${i === currentStep ? 'game-progress-dot--current' : i < currentStep ? 'game-progress-dot--done' : ''}`}
                            aria-hidden="true"
                        />
                    ))}
                </div>

                {/* Step content */}
                <h2
                    id="onboarding-tour-title"
                    className="text-2xl font-display font-bold text-white mb-3 text-center"
                >
                    {step.title}
                </h2>
                <p className="text-white/80 text-center mb-8 leading-relaxed">
                    {step.description}
                </p>

                {/* Action buttons */}
                <div className="flex flex-col items-center gap-3">
                    <button
                        type="button"
                        onClick={handleNext}
                        className="w-full wordle-button wordle-primary text-lg"
                    >
                        {isLastStep ? 'Start Playing' : 'Next'}
                    </button>
                    {!isLastStep && (
                        <button
                            onClick={handleSkip}
                            className="text-sm text-white/40 hover:text-white/70 transition-colors"
                        >
                            Skip Tutorial
                        </button>
                    )}
                </div>

                {/* Step counter */}
                <div className="mt-4 text-center text-white/30 text-xs">
                    Step {currentStep + 1} of {STEPS.length}
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';

const SLIDES = [
    {
        emoji: '🎯',
        title: 'Find the Connection',
        description: 'Two images collide in a Venn Diagram. Your job is to find the clever link that connects them.'
    },
    {
        emoji: '⏱️',
        title: 'Race the Clock',
        description: "You have 60 seconds to submit your answer. Type your connection and press Enter!"
    },
    {
        emoji: '🤖',
        title: 'Gemini Judges',
        description: "Our AI host will score your wit, relevance, and creativity. Can you impress the machine?"
    }
];

export function OnboardingModal({ onClose }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const skip = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md mx-4">
                <div className="glass-panel rounded-3xl p-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="text-6xl mb-4">{SLIDES[currentSlide].emoji}</div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                        {SLIDES[currentSlide].title}
                    </h2>
                    <p className="text-white/60 mb-8">
                        {SLIDES[currentSlide].description}
                    </p>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {SLIDES.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                                        ? 'bg-white w-6'
                                        : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={skip}
                            className="flex-1 py-3 text-white/60 hover:text-white transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={nextSlide}
                            className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            {currentSlide < SLIDES.length - 1 ? 'Next' : "Let's Play!"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

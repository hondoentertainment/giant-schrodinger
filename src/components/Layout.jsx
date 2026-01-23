import React from 'react';

export function Layout({ children }) {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[oklch(0.6_0.2_300)] opacity-20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[oklch(0.6_0.2_200)] opacity-20 blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-6xl px-4 py-8 flex flex-col items-center">
                {children}
            </div>
        </div>
    );
}

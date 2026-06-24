import React from 'react';

export function Layout({ children }) {
    return (
        <div className="wordle-shell relative min-h-screen w-full flex flex-col items-center overflow-x-hidden">
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <main id="main-content" className="relative z-10 w-full max-w-5xl px-4 pb-8 flex flex-col items-center" tabIndex={-1}>
                {children}
            </main>
        </div>
    );
}

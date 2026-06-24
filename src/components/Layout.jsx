import React from 'react';

export function Layout({ children }) {
    return (
        <div className="wordle-shell relative flex h-[100dvh] min-h-0 w-full flex-col items-center overflow-hidden">
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <main
                id="main-content"
                className="relative z-10 flex w-full max-w-5xl flex-1 min-h-0 flex-col items-center overflow-y-auto overflow-x-hidden px-4 pb-4"
                tabIndex={-1}
            >
                {children}
            </main>
        </div>
    );
}

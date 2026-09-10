import React from 'react';
import { LegalFooter } from './LegalFooter';

export function Layout({ children, onPrivacy, onTerms, hideFooter = false }) {
    return (
        <div className="wordle-shell relative flex h-[100dvh] min-h-0 w-full flex-col items-center overflow-hidden">
            <div className="game-ambient" aria-hidden="true">
                <div className="game-ambient-orb game-ambient-orb--blue" />
                <div className="game-ambient-orb game-ambient-orb--purple" />
                <div className="game-ambient-orb game-ambient-orb--teal" />
            </div>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <main
                id="main-content"
                className="game-main"
                tabIndex={-1}
            >
                {children}
                {onPrivacy && onTerms && !hideFooter ? (
                    <LegalFooter onPrivacy={onPrivacy} onTerms={onTerms} />
                ) : null}
            </main>
        </div>
    );
}

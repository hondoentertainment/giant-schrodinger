import React from 'react';
import { HelpCircle, Unlock } from 'lucide-react';

export function LobbyActionLinks({
    inviteCopied,
    handleInvite,
    setOnboardingDismissCallback,
    setShowOnboarding,
    setShowUnlockModal,
}) {
    return (
        <div className="flex flex-wrap gap-4 justify-center mb-4">
            <button
                onClick={handleInvite}
                className="text-sm text-white/50 hover:text-white underline min-h-[44px] flex items-center"
                aria-label={inviteCopied ? 'Link copied to clipboard' : 'Invite friends to play'}
            >
                {inviteCopied ? 'Copied!' : 'Invite friends to play'}
            </button>
            <button
                onClick={() => {
                    setOnboardingDismissCallback(() => () => setShowOnboarding(false));
                    setShowOnboarding(true);
                }}
                className="text-sm text-white/50 hover:text-white underline flex items-center gap-1 min-h-[44px]"
                aria-label="How it works"
            >
                <HelpCircle className="w-4 h-4" />
                How it works
            </button>
            <button
                onClick={() => setShowUnlockModal(true)}
                className="text-sm text-white/50 hover:text-white underline flex items-center gap-1 min-h-[44px]"
                aria-label="How to unlock avatars and themes"
            >
                <Unlock className="w-4 h-4" />
                Unlocks
            </button>
        </div>
    );
}

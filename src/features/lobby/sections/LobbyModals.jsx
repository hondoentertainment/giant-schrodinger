import React from 'react';
import { OnboardingModal } from '../../../components/OnboardingModal';
import { OnboardingTour } from '../../../components/OnboardingTour';
import { UnlockModal } from '../../../components/UnlockModal';
import { FriendProfile } from '../../social/FriendProfile';

export function LobbyModals({
    showOnboarding,
    onboardingDismissCallback,
    showTour,
    handleTourComplete,
    showUnlockModal,
    setShowUnlockModal,
    selectedFriend,
    setSelectedFriend,
}) {
    return (
        <>
            {showOnboarding && onboardingDismissCallback && (
                <OnboardingModal onDismiss={onboardingDismissCallback} />
            )}
            {showTour && <OnboardingTour onComplete={handleTourComplete} />}
            {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}
            {selectedFriend && <FriendProfile friend={selectedFriend} onClose={() => setSelectedFriend(null)} onChallenge={() => { setSelectedFriend(null); }} />}
        </>
    );
}

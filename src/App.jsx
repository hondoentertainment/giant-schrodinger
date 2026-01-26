import React, { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { GameProvider, useGame } from './context/GameContext'
import { Lobby } from './features/lobby/Lobby'
import { Round } from './features/round/Round'
import { Reveal } from './features/reveal/Reveal'
import { Gallery } from './features/gallery/Gallery'
import { FinalResults } from './features/results/FinalResults'
import { OnboardingModal } from './components/OnboardingModal'
import logo from './assets/logo.png'

function GameContent() {
    const { gameState } = useGame();
    const [roundData, setRoundData] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('vwf_onboarded');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleCloseOnboarding = () => {
        localStorage.setItem('vwf_onboarded', 'true');
        setShowOnboarding(false);
    };

    const handleRoundSubmit = (data) => {
        setRoundData(data);
    };

    return (
        <Layout>
            {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

            <div className="mb-8 text-center flex flex-col items-center">
                <img src={logo} alt="Venn with Friends" className="w-20 h-20 mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                <h1 className="text-5xl font-display font-black text-gradient-vibrant tracking-tight mb-1">
                    VENN
                </h1>
                <h2 className="text-lg font-light tracking-widest uppercase text-white/60">
                    with Friends
                </h2>
            </div>

            {gameState === 'LOBBY' && <Lobby />}
            {gameState === 'GALLERY' && <Gallery />}
            {gameState === 'ROUND' && <Round onSubmit={handleRoundSubmit} />}
            {gameState === 'REVEAL' && roundData && (
                <Reveal submission={roundData.submission} assets={roundData.assets} />
            )}
            {gameState === 'FINAL_RESULTS' && <FinalResults />}
        </Layout>
    );
}

function App() {
    return (
        <GameProvider>
            <GameContent />
        </GameProvider>
    )
}

export default App

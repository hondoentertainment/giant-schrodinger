import React, { useState } from 'react'
import { Layout } from './components/Layout'
import { GameProvider, useGame } from './context/GameContext'
import { Lobby } from './features/lobby/Lobby'
import { Round } from './features/round/Round'
import { Reveal } from './features/reveal/Reveal'
import { Gallery } from './features/gallery/Gallery'

function GameContent() {
    const { gameState } = useGame();
    const [roundData, setRoundData] = useState(null);

    const handleRoundSubmit = (data) => {
        setRoundData(data);
    };

    return (
        <Layout>
            <div className="mb-8 text-center">
                <h1 className="text-6xl font-display font-black text-gradient-vibrant tracking-tight mb-2">
                    VENN
                </h1>
                <h2 className="text-xl font-light tracking-widest uppercase text-white/60">
                    with Friends
                </h2>
            </div>

            {gameState === 'LOBBY' && <Lobby />}
            {gameState === 'GALLERY' && <Gallery />}
            {gameState === 'ROUND' && <Round onSubmit={handleRoundSubmit} />}
            {gameState === 'REVEAL' && roundData && (
                <Reveal submission={roundData.submission} assets={roundData.assets} />
            )}
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

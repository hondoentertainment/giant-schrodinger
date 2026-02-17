import React, { useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/Toast'
import { GameProvider, useGame } from './context/GameContext'
import { RoomProvider, useRoom } from './context/RoomContext'
import { Lobby } from './features/lobby/Lobby'
import { Round } from './features/round/Round'
import { Reveal } from './features/reveal/Reveal'
import { Gallery } from './features/gallery/Gallery'
import { SessionSummary } from './features/summary/SessionSummary'
import { JudgeRound } from './features/judge/JudgeRound'
import { RoomLobby } from './features/room/RoomLobby'
import { MultiplayerRound } from './features/room/MultiplayerRound'
import { MultiplayerReveal } from './features/room/MultiplayerReveal'
import { parseJudgeShareUrl } from './services/share'

function GameContent() {
    const { gameState } = useGame();
    const { isMultiplayer, roomPhase } = useRoom();
    const [roundData, setRoundData] = useState(null);
    const [judgePayload, setJudgePayload] = useState(() => parseJudgeShareUrl());

    useEffect(() => {
        const onHashChange = () => setJudgePayload(parseJudgeShareUrl());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const handleRoundSubmit = (data) => {
        setRoundData(data);
    };

    const handleJudgeDone = () => {
        setJudgePayload(null);
    };

    // Judge mode (external link)
    if (judgePayload) {
        return (
            <Layout>
                <div className="mb-8 text-center">
                    <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight"><span className="text-gradient-vibrant">VENN</span> <span className="text-xl font-light tracking-widest text-white/60 uppercase">with Friends</span></h1>
                </div>
                <JudgeRound payload={judgePayload} onDone={handleJudgeDone} />
            </Layout>
        );
    }

    // Multiplayer mode
    if (isMultiplayer) {
        return (
            <Layout>
                <div className="mb-8 text-center">
                    <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight"><span className="text-gradient-vibrant">VENN</span> <span className="text-xl font-light tracking-widest text-white/60 uppercase">with Friends</span></h1>
                </div>
                {roomPhase === 'lobby' && <RoomLobby />}
                {roomPhase === 'playing' && <MultiplayerRound />}
                {roomPhase === 'revealing' && <MultiplayerReveal />}
                {roomPhase === 'finished' && <MultiplayerReveal />}
            </Layout>
        );
    }

    // Solo mode
    return (
        <Layout>
            <div className="mb-8 text-center">
                <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight"><span className="text-gradient-vibrant">VENN</span> <span className="text-xl font-light tracking-widest text-white/60 uppercase">with Friends</span></h1>
            </div>

            {gameState === 'LOBBY' && <Lobby />}
            {gameState === 'GALLERY' && <Gallery />}
            {gameState === 'ROUND' && <Round onSubmit={handleRoundSubmit} />}
            {gameState === 'REVEAL' && roundData && (
                <Reveal submission={roundData.submission} assets={roundData.assets} />
            )}
            {gameState === 'SESSION_SUMMARY' && <SessionSummary />}
        </Layout>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <GameProvider>
                    <RoomProvider>
                        <GameContent />
                        <ToastContainer />
                    </RoomProvider>
                </GameProvider>
            </ToastProvider>
        </ErrorBoundary>
    )
}

export default App

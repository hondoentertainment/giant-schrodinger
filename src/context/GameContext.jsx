import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('vwf_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [gameState, setGameState] = useState('LOBBY'); // LOBBY, ROUND, REVEAL
    const [sessionId, setSessionId] = useState(null);
    const [roundNumber, setRoundNumber] = useState(1);
    const [totalRounds, setTotalRounds] = useState(3);
    const [sessionScore, setSessionScore] = useState(0);
    const [roundComplete, setRoundComplete] = useState(false);
    const [sessionResults, setSessionResults] = useState([]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('vwf_user', JSON.stringify(user));
        }
    }, [user]);

    const login = (profile) => {
        setUser(profile);
        setGameState('LOBBY'); // Stay in lobby until they click 'Find Match' or similar
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('vwf_user');
        setGameState('LOBBY');
    };

    const startSession = (rounds = 3) => {
        setSessionId(Date.now().toString());
        setRoundNumber(1);
        setTotalRounds(rounds);
        setSessionScore(0);
        setSessionResults([]);
        setRoundComplete(false);
        setGameState('LOBBY');
    };

    const beginRound = () => {
        setRoundComplete(false);
        setGameState('ROUND');
    };

    const completeRound = (result) => {
        setSessionResults((prev) => [...prev, result]);
        setSessionScore((prev) => prev + (result?.score || 0));
        setRoundComplete(true);
    };

    const advanceRound = () => {
        setRoundNumber((prev) => Math.min(prev + 1, totalRounds));
        setRoundComplete(false);
        setGameState('LOBBY');
    };

    const endSession = () => {
        setSessionId(null);
        setRoundNumber(1);
        setTotalRounds(3);
        setSessionScore(0);
        setRoundComplete(false);
        setSessionResults([]);
        setGameState('LOBBY');
    };

    return (
        <GameContext.Provider
            value={{
                user,
                login,
                logout,
                gameState,
                setGameState,
                sessionId,
                roundNumber,
                totalRounds,
                sessionScore,
                roundComplete,
                sessionResults,
                startSession,
                beginRound,
                completeRound,
                advanceRound,
                endSession,
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    return useContext(GameContext);
}

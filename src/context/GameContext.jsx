import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBestStreak, saveBestStreak } from '../services/storage';

const GameContext = createContext();

export function GameProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('vwf_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [gameState, setGameState] = useState('LOBBY'); // LOBBY, ROUND, REVEAL, FINAL_RESULTS, GALLERY

    // Multi-round state
    const [gameMode, setGameMode] = useState('quick'); // 'quick' (1 round) or 'championship' (3 rounds)
    const [judgeMode, setJudgeMode] = useState('ai'); // 'ai' or 'human'
    const [assetTheme, setAssetTheme] = useState('random'); // Theme for assets
    const [currentRound, setCurrentRound] = useState(1);
    const [roundScores, setRoundScores] = useState([]);

    // Streak tracking
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(() => getBestStreak());

    const maxRounds = gameMode === 'championship' ? 3 : 1;

    useEffect(() => {
        if (user) {
            localStorage.setItem('vwf_user', JSON.stringify(user));
        }
    }, [user]);

    const login = (profile) => {
        setUser(profile);
        setGameState('LOBBY');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('vwf_user');
        setGameState('LOBBY');
    };

    const startGame = (mode = 'quick', judge = 'ai', theme = 'random') => {
        setGameMode(mode);
        setJudgeMode(judge);
        setAssetTheme(theme);
        setCurrentRound(1);
        setRoundScores([]);
        setGameState('ROUND');
    };

    const recordRoundScore = (score) => {
        setRoundScores(prev => [...prev, score]);

        // Update streak: 7+ is considered a "good" score
        if (score >= 7) {
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            if (newStreak > bestStreak) {
                setBestStreak(newStreak);
                saveBestStreak(newStreak);
            }
        } else {
            setCurrentStreak(0);
        }
    };

    const nextRound = () => {
        setCurrentRound(prev => prev + 1);
        setGameState('ROUND');
    };

    const resetGame = () => {
        setCurrentRound(1);
        setRoundScores([]);
        setGameState('LOBBY');
    };

    return (
        <GameContext.Provider value={{
            user,
            login,
            logout,
            gameState,
            setGameState,
            gameMode,
            setGameMode,
            judgeMode,
            setJudgeMode,
            assetTheme,
            setAssetTheme,
            currentRound,
            maxRounds,
            roundScores,
            currentStreak,
            bestStreak,
            startGame,
            recordRoundScore,
            nextRound,
            resetGame
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    return useContext(GameContext);
}

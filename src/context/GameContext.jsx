import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBestStreak, saveBestStreak, signInUser, syncUserProfile } from '../services/storage';

const GameContext = createContext();

export function GameProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('vwf_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [gameState, setGameState] = useState('LOBBY'); // LOBBY, ROUND, REVEAL, FINAL_RESULTS, GALLERY

    // Multi-round state
    const [gameMode, setGameMode] = useState('quick'); // 'quick', 'championship', 'daily', or 'challenge'

    // Challenge mode state (async multiplayer)
    const [challengeData, setChallengeData] = useState(null);
    const [judgeMode, setJudgeMode] = useState('ai'); // 'ai' or 'human'
    const [assetTheme, setAssetTheme] = useState('random'); // Theme for assets
    const [roundDuration, setRoundDuration] = useState(60); // Round duration in seconds
    const [currentRound, setCurrentRound] = useState(1);
    const [roundScores, setRoundScores] = useState([]);
    const [personality, setPersonality] = useState(() => {
        return localStorage.getItem('vwf_personality') || 'chaos';
    });

    // Streak tracking
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(() => getBestStreak());

    const maxRounds = gameMode === 'championship' ? 3 : 1;

    useEffect(() => {
        // Authenticate anonymously
        signInUser().then(u => {
            if (u) {
                console.log("Authenticated as", u.uid);
                // Sync profile if local exists
                if (user) syncUserProfile(user);
            }
        });
    }, []);

    useEffect(() => {
        if (user) {
            localStorage.setItem('vwf_user', JSON.stringify(user));
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem('vwf_personality', personality);
    }, [personality]);

    const login = (profile) => {
        setUser(profile);
        setGameState('LOBBY');
        syncUserProfile(profile);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('vwf_user');
        setGameState('LOBBY');
    };

    const startGame = (mode = 'quick', judge = 'ai', theme = 'random', duration = 60) => {
        setGameMode(mode);
        setJudgeMode(judge);
        setAssetTheme(theme);
        setRoundDuration(duration);
        setCurrentRound(1);
        setRoundScores([]);
        setChallengeData(null);
        setGameState('ROUND');
    };

    // Start a challenge game with specific assets and opponent data
    const startChallenge = (challenge) => {
        setGameMode('challenge');
        setJudgeMode('ai');
        setRoundDuration(60);
        setCurrentRound(1);
        setRoundScores([]);
        setChallengeData(challenge);
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
        setChallengeData(null);
        // Clear challenge URL parameter
        if (window.location.search.includes('challenge=')) {
            window.history.replaceState({}, '', window.location.pathname);
        }
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
            roundDuration,
            setRoundDuration,
            currentRound,
            maxRounds,
            roundScores,
            currentStreak,
            bestStreak,
            challengeData,
            personality,
            setPersonality,
            startGame,
            startChallenge,
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

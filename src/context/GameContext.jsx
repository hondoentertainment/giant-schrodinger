import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MEDIA_TYPES } from '../data/themes';

const GameContext = createContext();

// Round modifier definitions that create a session arc
const ROUND_MODIFIERS = {
    normal: {
        id: 'normal',
        label: 'Standard Round',
        description: 'Classic connection challenge',
        timeFactor: 1.0,
        scoreFactor: 1.0,
        icon: '🎯',
    },
    speed: {
        id: 'speed',
        label: 'Speed Round',
        description: 'Half the time, 1.5x the points!',
        timeFactor: 0.5,
        scoreFactor: 1.5,
        icon: '⚡',
    },
    doubleOrNothing: {
        id: 'doubleOrNothing',
        label: 'Double or Nothing',
        description: 'Score 7+ to double your points, or get zero!',
        timeFactor: 1.0,
        scoreFactor: 2.0,
        scoreThreshold: 7,
        icon: '🎲',
    },
    showdown: {
        id: 'showdown',
        label: 'Final Showdown',
        description: 'Last round! 2x points, tighter timer.',
        timeFactor: 0.7,
        scoreFactor: 2.0,
        icon: '🏆',
    },
};

function buildSessionArc(totalRounds) {
    const arc = [];
    for (let i = 1; i <= totalRounds; i++) {
        if (i === totalRounds && totalRounds >= 3) {
            arc.push(ROUND_MODIFIERS.showdown);
        } else if (totalRounds >= 5 && i === Math.ceil(totalRounds * 0.4)) {
            arc.push(ROUND_MODIFIERS.speed);
        } else if (totalRounds >= 5 && i === Math.ceil(totalRounds * 0.7)) {
            arc.push(ROUND_MODIFIERS.doubleOrNothing);
        } else if (totalRounds === 3 && i === 2) {
            arc.push(ROUND_MODIFIERS.speed);
        } else {
            arc.push(ROUND_MODIFIERS.normal);
        }
    }
    return arc;
}

export { ROUND_MODIFIERS };

export function GameProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('vwf_user');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (!parsed.mediaType) parsed.mediaType = MEDIA_TYPES.IMAGE;
            if (parsed.useCustomImages === undefined) parsed.useCustomImages = false;
            return parsed;
        }
        return null;
    });

    const [gameState, setGameState] = useState('LOBBY');
    const [sessionId, setSessionId] = useState(null);
    const [roundNumber, setRoundNumber] = useState(1);
    const [totalRounds, setTotalRounds] = useState(3);
    const [sessionScore, setSessionScore] = useState(0);
    const [roundComplete, setRoundComplete] = useState(false);
    const [sessionResults, setSessionResults] = useState([]);
    const [sessionArc, setSessionArc] = useState([]);
    const [isDailyChallenge, setIsDailyChallenge] = useState(false);

    const currentModifier = useMemo(() => {
        if (!sessionArc.length || roundNumber < 1) return ROUND_MODIFIERS.normal;
        return sessionArc[roundNumber - 1] || ROUND_MODIFIERS.normal;
    }, [sessionArc, roundNumber]);

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

    const startSession = (rounds = 3, daily = false) => {
        const arc = buildSessionArc(rounds);
        setSessionId(Date.now().toString());
        setRoundNumber(1);
        setTotalRounds(rounds);
        setSessionScore(0);
        setSessionResults([]);
        setRoundComplete(false);
        setSessionArc(arc);
        setIsDailyChallenge(daily);
        setGameState('LOBBY');
    };

    const beginRound = () => {
        setRoundComplete(false);
        setGameState('ROUND');
    };

    const completeRound = (result) => {
        const mod = sessionArc[roundNumber - 1] || ROUND_MODIFIERS.normal;
        let finalScore = result?.score || 0;

        if (mod.id === 'doubleOrNothing') {
            finalScore = finalScore >= (mod.scoreThreshold || 7) ? finalScore * 2 : 0;
        }

        const enrichedResult = {
            ...result,
            score: finalScore,
            modifier: mod,
            roundNumber,
        };
        setSessionResults((prev) => [...prev, enrichedResult]);
        setSessionScore((prev) => prev + finalScore);
        setRoundComplete(true);
    };

    const advanceRound = () => {
        setRoundNumber((prev) => Math.min(prev + 1, totalRounds));
        setRoundComplete(false);
    };

    const nextRound = () => {
        if (roundNumber >= totalRounds) {
            setGameState('SESSION_SUMMARY');
            return;
        }
        advanceRound();
        beginRound();
    };

    const endSession = () => {
        setSessionId(null);
        setRoundNumber(1);
        setTotalRounds(3);
        setSessionScore(0);
        setRoundComplete(false);
        setSessionResults([]);
        setSessionArc([]);
        setIsDailyChallenge(false);
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
                sessionArc,
                currentModifier,
                isDailyChallenge,
                startSession,
                beginRound,
                completeRound,
                advanceRound,
                nextRound,
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

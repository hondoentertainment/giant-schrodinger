import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('vwf_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [gameState, setGameState] = useState('LOBBY'); // LOBBY, ROUND, REVEAL

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

    return (
        <GameContext.Provider value={{ user, login, logout, gameState, setGameState }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    return useContext(GameContext);
}

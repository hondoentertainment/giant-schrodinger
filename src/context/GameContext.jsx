import { getBestStreak, saveBestStreak, signInUser, syncUserProfile, getTotalGames } from '../services/storage';
import { unlockAchievement, getUnlockedAchievements } from '../services/achievements';

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
    const [roundSubmissions, setRoundSubmissions] = useState([]);
    const [personality, setPersonality] = useState(() => {
        return localStorage.getItem('vwf_personality') || 'chaos';
    });

    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(() => getBestStreak());

    // Achievements
    const [achievements, setAchievements] = useState(() => getUnlockedAchievements());
    const [achievementQueue, setAchievementQueue] = useState([]); // Queue for popups
    const [currentAchievement, setCurrentAchievement] = useState(null); // Active popup

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
        setRoundSubmissions([]);
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
        setRoundSubmissions([]);
        setChallengeData(challenge);
        setGameState('ROUND');
    };

    const recordRoundResult = (score, submission) => {
        setRoundScores(prev => [...prev, score]);
        setRoundSubmissions(prev => [...prev, submission]);

        let newAchievements = [];

        if (score === 10) {
            if (unlockAchievement('PERFECT_SCORE')) newAchievements.push('PERFECT_SCORE');
        }

        if (score >= 7) {
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);

            if (newStreak === 3 && unlockAchievement('STREAK_3')) newAchievements.push('STREAK_3');
            if (newStreak === 5 && unlockAchievement('STREAK_5')) newAchievements.push('STREAK_5');

            if (newStreak > bestStreak) {
                setBestStreak(newStreak);
                saveBestStreak(newStreak);
            }
        } else {
            setCurrentStreak(0);
        }

        if (getTotalGames() >= 10 && unlockAchievement('GAMES_10')) newAchievements.push('GAMES_10');
        if (unlockAchievement('FIRST_GAME')) newAchievements.push('FIRST_GAME');

        if (newAchievements.length > 0) {
            setAchievements(getUnlockedAchievements());
            setAchievementQueue(prev => [...prev, ...newAchievements]);
        }
    };

    const clearCurrentAchievement = () => {
        setCurrentAchievement(null);
    };

    useEffect(() => {
        if (!currentAchievement && achievementQueue.length > 0) {
            setCurrentAchievement(achievementQueue[0]);
            setAchievementQueue(prev => prev.slice(1));
        }
    }, [achievementQueue, currentAchievement]);

    const nextRound = () => {
        setCurrentRound(prev => prev + 1);
        setGameState('ROUND');
    };

    const resetGame = () => {
        setCurrentRound(1);
        setRoundScores([]);
        setRoundSubmissions([]);
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
            roundSubmissions,
            currentStreak,
            bestStreak,
            achievements,
            currentAchievement,
            clearCurrentAchievement,
            challengeData,
            personality,
            setPersonality,
            startGame,
            startChallenge,
            recordRoundResult,
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
